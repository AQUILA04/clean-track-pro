<#import "template.ftl" as layout>

<#-- After execute-actions-email (e.g. UPDATE_PASSWORD), Keycloak destroys the auth
     session (END_AFTER_REQUIRED_ACTIONS). Redirecting to url.loginUrl / restart-flow
     then fails with "Restart login cookie not found".
     Always send the user to the application so it can start a fresh OIDC login. -->
<#assign isAccountUpdated =
  (messageHeader!"") == "accountUpdatedTitle"
  || (messageHeader!"") == "accountUpdatedMessage"
  || (message.summary!"") == msg("accountUpdatedMessage")
  || (message.summary!"") == msg("accountPasswordUpdatedMessage")
>
<#if pageRedirectUri?has_content>
  <#assign appRedirectUrl = pageRedirectUri>
<#elseif client?? && client.baseUrl?has_content>
  <#assign appRedirectUrl = client.baseUrl>
<#else>
  <#assign appRedirectUrl = "">
</#if>

<@layout.registrationLayout displayMessage=false; section>
  <#if section = "header">
    <h1 class="ct-title">
      <#if isAccountUpdated>
        ${msg("accountUpdatedTitle")}
      <#elseif messageHeader??>
        ${kcSanitize(msg("${messageHeader}"))?no_esc}
      <#else>
        ${kcSanitize(message.summary)!''}
      </#if>
    </h1>
    <#if isAccountUpdated>
      <p class="ct-subtitle">${msg("accountUpdatedRedirectHint")}</p>
    </#if>
  <#elseif section = "form">
    <div id="kc-info-message" class="ct-info-message">
      <#if !isAccountUpdated>
        <p class="ct-info-text">
          ${kcSanitize(message.summary)?no_esc}<#if requiredActions??><#list requiredActions>: <#items as reqActionItem>${kcSanitize(msg("requiredAction.${reqActionItem}"))?no_esc}<#sep>, </#items></#list></#if>
        </p>
      </#if>

      <#if isAccountUpdated>
        <#if appRedirectUrl?has_content>
          <div class="ct-info-actions">
            <a id="ct-back-to-login" class="pf-v5-c-button pf-v5-c-button--primary pf-m-block" href="${appRedirectUrl}">
              ${msg("proceedToLogin")}
            </a>
          </div>
          <script type="module">
            window.setTimeout(() => {
              window.location.replace("${appRedirectUrl?no_esc}");
            }, 1500);
          </script>
        </#if>
      <#elseif skipLink??>
      <#else>
        <div class="ct-info-actions">
          <#if pageRedirectUri?has_content>
            <a class="pf-v5-c-button pf-v5-c-button--primary pf-m-block" href="${pageRedirectUri}">${msg("backToApplication")}</a>
          <#elseif actionUri?has_content>
            <a class="ct-link" href="${actionUri}">${msg("proceedWithAction")}</a>
          <#elseif client?? && client.baseUrl?has_content>
            <a class="pf-v5-c-button pf-v5-c-button--primary pf-m-block" href="${client.baseUrl}">${msg("backToApplication")}</a>
          </#if>
        </div>
      </#if>
    </div>
  </#if>
</@layout.registrationLayout>
