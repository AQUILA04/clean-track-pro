import React from 'react';
import { Table } from '@/components/ui/table';
import { Button } from '@/components/ui/Button';
import { Pencil, Trash2, Shirt, Ticket, Bed, Briefcase, Gem } from 'lucide-react';
import { ArticleType } from '@/services/article-type.service';

interface ArticleTableProps {
    articles: ArticleType[];
    onEdit: (article: ArticleType) => void;
    onDelete: (article: ArticleType) => void;
}

const IconMap: Record<string, React.ReactNode> = {
    'Shirt': <Shirt className="h-5 w-5 text-blue-500" />,
    'Ticket': <Ticket className="h-5 w-5 text-purple-500" />,
    'Bed': <Bed className="h-5 w-5 text-green-500" />,
    'Briefcase': <Briefcase className="h-5 w-5 text-orange-500" />,
    'Gem': <Gem className="h-5 w-5 text-pink-500" />,
};

export const ArticleTable: React.FC<ArticleTableProps> = ({ articles, onEdit, onDelete }) => {
    return (
        <Table
            data={articles}
            keyExtractor={(article) => article.id}
            columns={[
                {
                    header: 'ICÔNE',
                    accessor: (article) => (
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            {IconMap[article.icon as string] || <Shirt className="h-5 w-5 text-muted-foreground" />}
                        </div>
                    ),
                    className: "w-16"
                },
                {
                    header: 'NOM DE L\'ARTICLE',
                    accessor: (article) => (
                        <div>
                            <div className="font-semibold text-foreground">{article.name}</div>
                            <div className="text-xs text-muted-foreground">ID: {article.articleId || article.id}</div>
                        </div>
                    ),
                },
                {
                    header: 'CATÉGORIE',
                    accessor: (article) => (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-muted text-muted-foreground uppercase tracking-wide">
                            {article.category}
                        </span>
                    ),
                },
                {
                    header: 'ACTIONS',
                    accessor: (article) => (
                        <div className="flex items-center justify-end space-x-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onEdit(article)}
                                className="text-muted-foreground hover:text-foreground p-2 h-9 w-9"
                            >
                                <Pencil className="h-5 w-5" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onDelete(article)}
                                className="text-muted-foreground hover:text-red-500 p-2 h-9 w-9"
                            >
                                <Trash2 className="h-5 w-5" />
                            </Button>
                        </div>
                    ),
                    className: "text-right"
                }
            ]}
        />
    );
};
