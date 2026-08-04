<#import "template.ftl" as layout>

<#-- Prefer application entry so users can start a fresh OIDC login after a
     dead auth session (e.g. Restart login cookie not found). -->
<#if client?? && client.baseUrl?has_content>
  <#assign appRedirectUrl = client.baseUrl>
<#elseif pageRedirectUri?has_content>
  <#assign appRedirectUrl = pageRedirectUri>
<#else>
  <#assign appRedirectUrl = "">
</#if>

<@layout.registrationLayout displayMessage=false; section>
  <#if section = "header">
    <h1 class="ct-title">${kcSanitize(msg("errorTitle"))?no_esc}</h1>
  <#elseif section = "form">
    <div id="kc-error-message" class="ct-info-message">
      <p class="ct-info-text">${kcSanitize(message.summary)?no_esc}</p>
      <#if traceId??>
        <p class="ct-info-text">${msg("traceIdSupportMessage", traceId)}</p>
      </#if>
      <#if !(skipLink??) && appRedirectUrl?has_content>
        <div class="ct-info-actions">
          <a id="ct-back-to-application" class="pf-v5-c-button pf-v5-c-button--primary pf-m-block" href="${appRedirectUrl}">
            ${msg("proceedToLogin")}
          </a>
        </div>
      </#if>
    </div>
  </#if>
</@layout.registrationLayout>
