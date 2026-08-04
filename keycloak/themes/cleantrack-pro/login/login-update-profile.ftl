<#import "template.ftl" as layout>
<#import "user-profile-commons.ftl" as userProfileCommons>
<#import "buttons.ftl" as buttons>
<@layout.registrationLayout displayMessage=messagesPerField.exists('global') displayRequiredFields=true; section>
    <#if section = "header">
        <h1 class="ct-title">${msg("loginProfileTitle")}</h1>
        <p class="ct-subtitle">${msg("loginProfileSubtitle")}</p>
    <#elseif section = "form">
        <form id="kc-update-profile-form" class="${properties.kcFormClass!}" action="${url.loginAction}" method="post">
            <@userProfileCommons.userProfileFormFields/>

            <div class="${properties.kcFormGroupClass!} ct-form-actions">
                <#if isAppInitiatedAction??>
                    <@buttons.button id="kc-submit" name="login" label="doSubmit" class=["kcButtonPrimaryClass", "kcButtonBlockClass"]/>
                    <@buttons.button id="kc-cancel" label="doCancel" name="cancel-aia" class=["kcButtonSecondaryClass", "kcButtonBlockClass"]/>
                <#else>
                    <@buttons.button id="kc-submit" name="login" label="doSubmit" class=["kcButtonPrimaryClass", "kcButtonBlockClass"]/>
                </#if>
            </div>
        </form>
    </#if>
</@layout.registrationLayout>
