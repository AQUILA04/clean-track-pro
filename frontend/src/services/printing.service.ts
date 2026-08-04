import axios from 'axios';
import { PrintableOrder } from '../types/printing.types';

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function formatReceiptDate(isoDate: string): string {
    try {
        return new Date(isoDate).toLocaleString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return isoDate;
    }
}

export function buildReceiptHtml(order: PrintableOrder): string {
    const itemsHtml = order.items
        .map(
            (item) => `
            <tr>
                <td>${escapeHtml(item.label)}</td>
                <td>${escapeHtml(item.service)}</td>
                <td style="text-align:right">${item.price.toFixed(0)}</td>
            </tr>
            <tr>
                <td colspan="3" style="font-size:10px;color:#666;font-family:monospace"># ${escapeHtml(item.qrCodeValue)}</td>
            </tr>`,
        )
        .join('');

    return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8" />
    <title>Reçu - ${escapeHtml(order.client.name)}</title>
    <style>
        @page { margin: 8mm; size: 80mm auto; }
        body {
            font-family: 'Courier New', Courier, monospace;
            font-size: 12px;
            color: #111;
            margin: 0;
            padding: 12px;
            width: 72mm;
        }
        h1 { font-size: 14px; margin: 0 0 4px; text-align: center; }
        .meta { text-align: center; font-size: 11px; margin-bottom: 12px; color: #444; }
        .section { margin: 10px 0; border-top: 1px dashed #999; padding-top: 8px; }
        table { width: 100%; border-collapse: collapse; }
        td { padding: 2px 0; vertical-align: top; }
        .total { font-weight: bold; font-size: 14px; text-align: right; margin-top: 8px; }
        .ref { font-size: 10px; color: #666; word-break: break-all; }
        @media print {
            body { padding: 0; }
        }
    </style>
</head>
<body>
    ${
        order.header.logoUrl
            ? `<div style="text-align:center;margin-bottom:8px"><img src="${escapeHtml(order.header.logoUrl)}" alt="" style="max-height:48px;max-width:160px;object-fit:contain" /></div>`
            : ''
    }
    <h1>${escapeHtml(order.header.tenantName)}</h1>
    <div class="meta">
        ${escapeHtml(order.header.siteName)}<br />
        ${order.header.address ? `${escapeHtml(order.header.address).replace(/\n/g, '<br />')}<br />` : ''}
        ${
            order.header.legalId || order.header.vatNumber
                ? `${[
                      order.header.legalId ? `ID: ${escapeHtml(order.header.legalId)}` : '',
                      order.header.vatNumber ? `TVA: ${escapeHtml(order.header.vatNumber)}` : '',
                  ]
                      .filter(Boolean)
                      .join(' · ')}<br />`
                : ''
        }
        ${formatReceiptDate(order.header.date)}
    </div>
    <div class="section">
        <strong>Client</strong><br />
        ${escapeHtml(order.client.name)}<br />
        ${order.client.phone ? `${escapeHtml(order.client.phone)}<br />` : ''}
        <span class="ref">N° ${escapeHtml(order.client.reference || order.client.qrCodeValue)}</span><br />
        <span class="ref">ID: ${escapeHtml(order.client.qrCodeValue)}</span>
    </div>
    <div class="section">
        <table>
            <thead>
                <tr>
                    <th align="left">Article</th>
                    <th align="left">Service</th>
                    <th align="right">Prix</th>
                </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
        </table>
    </div>
    <div class="section total">
        TOTAL: ${order.totals.totalPrice.toFixed(0)} ${escapeHtml(order.totals.currency)}
    </div>
    <div class="meta">
        Retrait prévu: ${formatReceiptDate(order.totals.dueDate)}
    </div>
    <script>
        window.onload = function () {
            window.focus();
            window.print();
        };
    </script>
</body>
</html>`;
}

export class PrintingService {
    private static getProxyUrl(): string {
        return process.env.NEXT_PUBLIC_PRINT_PROXY_URL || 'http://localhost:8080';
    }

    static async printOrder(order: PrintableOrder): Promise<void> {
        const url = `${this.getProxyUrl()}/print-order`;
        try {
            await axios.post(url, order);
        } catch (error) {
            console.error('PrintingService Error:', error);
            throw error;
        }
    }

    /** Opens the browser/OS print dialog with a formatted receipt. */
    static printViaBrowser(order: PrintableOrder): void {
        const html = buildReceiptHtml(order);
        const printWindow = window.open('', '_blank', 'width=420,height=640,noopener,noreferrer');
        if (!printWindow) {
            throw new Error('Impossible d\'ouvrir la fenêtre d\'impression. Autorisez les pop-ups.');
        }
        printWindow.document.open();
        printWindow.document.write(html);
        printWindow.document.close();
    }

    /**
     * Tries the local print proxy first (OS/printer bridge), then falls back to browser print.
     * Returns which method succeeded.
     */
    static async printWithFallback(order: PrintableOrder): Promise<'proxy' | 'browser'> {
        try {
            await this.printOrder(order);
            return 'proxy';
        } catch {
            this.printViaBrowser(order);
            return 'browser';
        }
    }
}
