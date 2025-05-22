import { type UIConfig } from "./ui";

export const getLoginModalAnalyticsProperties = (uiConfig?: UIConfig) => {
  return {
    ui_modal_login_methods_order: uiConfig?.loginMethodsOrder,
    ui_modal_z_index: uiConfig?.modalZIndex,
    ui_modal_display_errors_on_modal: uiConfig?.displayErrorsOnModal,
    ui_modal_login_grid_col: uiConfig?.loginGridCol,
    ui_modal_primary_button: uiConfig?.primaryButton,
    ui_modal_widget_type: uiConfig?.widgetType,
    ui_modal_target_id_used: Boolean(uiConfig?.targetId),
    ui_modal_logo_alignment: uiConfig?.logoAlignment,
    ui_modal_border_radius_type: uiConfig?.borderRadiusType,
    ui_modal_button_radius_type: uiConfig?.buttonRadiusType,
    ui_modal_sign_in_methods: uiConfig?.signInMethods,
    ui_modal_add_previous_login_hint: uiConfig?.addPreviousLoginHint,
    ui_modal_display_installed_external_wallets: uiConfig?.displayInstalledExternalWallets,
    ui_modal_display_external_wallets_count: uiConfig?.displayExternalWalletsCount,
  };
};
