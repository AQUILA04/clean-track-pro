<#import "field.ftl" as field>
<#import "footer.ftl" as loginFooter>

<#macro username>
  <#assign label>
    <#if !realm.loginWithEmailAllowed>${msg("username")}<#elseif !realm.registrationEmailAsUsername>${msg("usernameOrEmail")}<#else>${msg("email")}</#if>
  </#assign>
  <@field.group name="username" label=label>
    <div id="kc-username" class="${properties.kcInputGroup!} ct-username-box">
      <div class="ct-username-box__label">${label}</div>
      <div class="ct-username-box__row">
        <span id="kc-username-value">${auth.attemptedUsername!''}</span>
        <a id="reset-login" class="ct-username-box__reset" href="${url.loginRestartFlowUrl}" aria-label="${msg("restartLoginTooltip")}">
          <i class="${properties.kcResetFlowIcon!}" aria-hidden="true"></i>
        </a>
      </div>
    </div>
  </@field.group>
</#macro>

<#macro registrationLayout bodyClass="" displayInfo=false displayMessage=true displayRequiredFields=false>
<!DOCTYPE html>
<html class="${properties.kcHtmlClass!}"<#if realm.internationalizationEnabled && locale.supported?size gt 1> lang="${locale.currentLanguageTag}" dir="${(locale.rtl)?then('rtl','ltr')}"</#if>>

<head>
  <meta charset="utf-8">
  <meta name="robots" content="noindex, nofollow">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light">

  <#if properties.meta?has_content>
    <#list properties.meta?split(' ') as meta>
      <meta name="${meta?split('==')[0]}" content="${meta?split('==')[1]}"/>
    </#list>
  </#if>

  <title>${msg("loginTitle",(realm.displayName!''))}</title>
  <link rel="icon" href="${url.resourcesPath}/img/logo.svg" type="image/svg+xml">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>

  <#if properties.stylesCommon?has_content>
    <#list properties.stylesCommon?split(' ') as style>
      <link href="${url.resourcesCommonPath}/${style}" rel="stylesheet"/>
    </#list>
  </#if>
  <#if properties.styles?has_content>
    <#list properties.styles?split(' ') as style>
      <link href="${url.resourcesPath}/${style}" rel="stylesheet"/>
    </#list>
  </#if>

  <script type="importmap">
    {
      "imports": {
        "rfc4648": "${url.resourcesCommonPath}/vendor/rfc4648/rfc4648.js"
      }
    }
  </script>

  <#if properties.scripts?has_content>
    <#list properties.scripts?split(' ') as script>
      <script src="${url.resourcesPath}/${script}" type="module"></script>
    </#list>
  </#if>
  <#if scripts??>
    <#list scripts as script>
      <script src="${script}" type="module"></script>
    </#list>
  </#if>

  <script type="module">
    import { startSessionPolling } from "${url.resourcesPath}/js/authChecker.js";
    startSessionPolling("${url.ssoLoginInOtherTabsUrl?no_esc}");
  </script>

  <script type="module">
    document.addEventListener("click", (event) => {
      const link = event.target.closest("a[data-once-link]");
      if (!link) return;
      if (link.getAttribute("aria-disabled") === "true") {
        event.preventDefault();
        return;
      }
      const { disabledClass } = link.dataset;
      if (disabledClass) {
        link.classList.add(...disabledClass.trim().split(/\s+/));
      }
      link.setAttribute("role", "link");
      link.setAttribute("aria-disabled", "true");
    });
  </script>

  <#if authenticationSession??>
    <script type="module">
      import { checkAuthSession } from "${url.resourcesPath}/js/authChecker.js";
      checkAuthSession("${authenticationSession.authSessionIdHash?no_esc}");
    </script>
  </#if>
</head>

<body class="${properties.kcBodyClass!} ct-body" data-page-id="login-${pageId}">
  <div class="ct-page">
    <div class="ct-page__bg" aria-hidden="true"></div>

    <div class="ct-card">
      <div class="ct-card__hero">
        <#if realm.internationalizationEnabled && locale.supported?size gt 1>
          <nav class="ct-locale ct-locale--hero" aria-label="${msg("languages")}">
            <#list locale.supported?sort_by("label") as l>
              <a
                href="${l.url}"
                class="ct-locale__btn<#if l.languageTag == locale.currentLanguageTag> is-active</#if>"
                hreflang="${l.languageTag}"
                lang="${l.languageTag}"
              >
                <#if l.languageTag == 'fr'>FR<#elseif l.languageTag == 'en'>EN<#else>${l.label}</#if>
              </a>
            </#list>
          </nav>
        </#if>

        <div class="ct-card__hero-grid" aria-hidden="true"></div>
        <div class="ct-card__hero-glow" aria-hidden="true"></div>

        <div class="ct-card__hero-inner">
          <img class="ct-card__logo" src="${url.resourcesPath}/img/logo.svg" alt="CleanTrack Pro" width="220" height="44" />
          <p class="ct-hero-tagline">Gestion moderne de pressing &amp; blanchisserie</p>
        </div>
      </div>

      <div class="ct-card__main">
        <header class="ct-card__header">
          <#nested "header">
        </header>

        <div class="ct-card__body">
          <#if !(auth?has_content && auth.showUsername() && !auth.showResetCredentials())>
            <#if displayRequiredFields>
              <p class="ct-required-note">
                <span class="ct-required-mark">*</span> ${msg("requiredFields")}
              </p>
            </#if>
          <#else>
            <#if displayRequiredFields>
              <p class="ct-required-note">
                <span class="ct-required-mark">*</span> ${msg("requiredFields")}
              </p>
              <#nested "show-username">
              <@username />
            <#else>
              <#nested "show-username">
              <@username />
            </#if>
          </#if>

          <#if displayMessage && message?has_content && (message.type != 'warning' || !isAppInitiatedAction??)>
            <div class="ct-alert ct-alert--${message.type}" role="alert">
              <span class="ct-alert__icon" aria-hidden="true"></span>
              <span class="ct-alert__text">${message.summary}</span>
            </div>
          </#if>

          <#nested "form">

          <#if auth?has_content && auth.showTryAnotherWayLink()>
            <form id="kc-select-try-another-way-form" action="${url.loginAction}" method="post">
              <input type="hidden" name="tryAnotherWay" value="on"/>
              <a href="#" id="try-another-way" class="ct-link" onclick="document.forms['kc-select-try-another-way-form'].requestSubmit();return false;">
                ${msg("doTryAnotherWay")}
              </a>
            </form>
          </#if>

          <#nested "socialProviders">

          <#if displayInfo>
            <div id="kc-info" class="ct-info-block">
              <#nested "info">
            </div>
          </#if>
        </div>

        <footer class="ct-card__footer">
          <@loginFooter.content/>
        </footer>
      </div>
    </div>
  </div>
</body>
</html>
</#macro>
