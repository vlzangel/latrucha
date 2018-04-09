<?php
/**
 * Plugin Name: Modulo de Pago Sitef
 * Plugin URI: http://www.sitefdevenezuela.com/
 * Description: Modulo de pago con tarjetas de crédito a través de SITEF
 * Author: S&C Sistemas C.A
 * Author URI: http://www.scsistemas.com.ve/
 * Version: 1.0
 * Text Domain: wc-gateway-sitef
 * Domain Path: /i18n/languages/
 *
 * Copyright: (c) 2015 SC Sistemas C.A
 *
 * @package   wc-gateway-sitef
 * @author    S&C Sistemas C.A
 * @category  Admin
 * @copyright Copyright (c) 2015 SC Sistemas C.A
 *
 */

defined('ABSPATH') or exit;


// Make sure WooCommerce is active
if (!in_array('woocommerce/woocommerce.php', apply_filters('active_plugins', get_option('active_plugins')))) {
    return;
}


/**
 * Agrega este metodo de pago a los metodos de pago disponibles
 *
 * @since 1.0.0
 * @param array $gateways todos los metodos de pago disponibles
 * @return array $gateways + sitef gateway
 */
function wc_sitef_add_to_gateways($gateways)
{
    $gateways[] = 'WC_Gateway_Sitef';
    return $gateways;
}

add_filter('woocommerce_payment_gateways', 'wc_sitef_add_to_gateways');


/**
 * Agrega el link para configurar el metodo de pago
 *
 * @since 1.0.0
 * @param array $links todos los links disponibles
 * @return array $links + "Configurar"
 */
function wc_sitef_gateway_plugin_links($links)
{

    $plugin_links = array(
        '<a href="' . admin_url('admin.php?page=wc-settings&tab=checkout&section=sitef_gateway') . '">' . __('Configurar', 'wc-gateway-sitef') . '</a>'
    );

    return array_merge($plugin_links, $links);
}

add_filter('plugin_action_links_' . plugin_basename(__FILE__), 'wc_sitef_gateway_plugin_links');


/**
 * Modulo de Pago Sitef
 *
 * Genera un Modulo de pago con tarjetas de credito para ser procesadas a traves de Sitef
 *
 * @class        Modulo de Pago Sitef
 * @extends        WC_Payment_Gateway
 * @version        1.0.0
 * @package        WooCommerce/Classes/Payment
 * @author        S&C Sistemas
 */
add_action('plugins_loaded', 'wc_sitef_gateway_init', 11);

function wc_sitef_gateway_init()
{

    class WC_Gateway_Sitef extends WC_Payment_Gateway
    {
        /**
         * Constructor for the gateway.
         */
        public function __construct()
        {

            $this->id = 'sitef_gateway';
            $this->icon = apply_filters('woocommerce_sitef_icon', '');
            $this->has_fields = false;
            $this->method_title = __('Sitef', 'wc-gateway-sitef');
            $this->method_description = __('Permite pagos con tarjeta de crédito para ser procesadas a través de Sitef.', 'wc-gateway-sitef');

            // Load the settings.
            $this->init_form_fields();
            $this->init_settings();

            // Define user set variables
            $this->title = $this->get_option('title');
            $this->description = $this->get_option('description');
            $this->url = $this->get_option('url');
            $this->merchantId = $this->get_option('merchantId');
            $this->merchantKey = $this->get_option('merchantKey');
            $this->supports[] = 'default_credit_card_form';

            // Actions
            add_action('woocommerce_update_options_payment_gateways_' . $this->id, array($this, 'process_admin_options'));
            add_action('wp_enqueue_scripts', 'wp_adding_scripts');

            //Filters
            add_filter( 'woocommerce_credit_card_form_fields' , 'custom_credit_card_fields_sitef' , 10, 2 );

        }


        /**
         * Initialize Gateway Settings Form Fields
         */
        public function init_form_fields()
        {

            $this->form_fields = apply_filters('wc_offline_form_fields', array(

                'enabled' => array(
                    'title' => __('Habilitar/Deshabilitar', 'wc-gateway-sitef'),
                    'type' => 'checkbox',
                    'label' => __('Habilitar Modulo Sitef', 'wc-gateway-sitef'),
                    'default' => 'yes'
                ),

                'title' => array(
                    'title' => __('Título', 'wc-gateway-sitef'),
                    'type' => 'text',
                    'description' => __('Título asociado al metodo de Pago ', 'wc-gateway-offline'),
                    'default' => __('Pago con Tarjeta de Crédito', 'wc-gateway-sitef'),
                    'desc_tip' => true,
                ),

                'description' => array(
                    'title' => __('Descripcion', 'wwc-gateway-sitef'),
                    'type' => 'textarea',
                    'description' => __('Descripción del método de pago que el cliente vera al intentar procesar el pago.', 'wc-gateway-offline'),
                    'default' => __('Pagos con Tarjeta de Crédito: Visa, MasterCard o American Express', 'wc-gateway-offline'),
                    'desc_tip' => true,
                ),
                'url' => array(
                    'title' => __('URL', 'wc-gateway-sitef'),
                    'type' => 'text',
                    'description' => __('URL de conexion a Sitef ', 'wc-gateway-offline'),
                    'default' => __('https://esitef-homologacao.softwareexpress.com.br/e-sitef-hml/Payment2?wsdl', 'wc-gateway-sitef'),
                    'desc_tip' => true,
                ),
                'merchantId' => array(
                    'title' => __('Merchant Id', 'wc-gateway-sitef'),
                    'type' => 'text',
                    'description' => __('ID de conexion a Sitef ', 'wc-gateway-offline'),
                    'default' => __('truchaazul'),
                    'desc_tip' => true,
                ),
                'merchantKey' => array(
                    'title' => __('Merchant Key', 'wc-gateway-sitef'),
                    'type' => 'text',
                    'description' => __('Clave de conexion a Sitef ', 'wc-gateway-offline'),
                    'default' => __('56AB685F856A9ED3C8B89506909CDA034EFA70ABE464D6F4AF4ED0C98B3BBF6E'),
                    'desc_tip' => true,
                )
            ));
        }

        /**
         * Process the payment and return the result
         *
         * @param int $order_id
         * @return array
         */
        public function process_payment($order_id)
        {

            $order = wc_get_order($order_id);

            if (!isset($_POST['sitef_gateway-card-number'] ) || $_POST['sitef_gateway-card-number']==''){
                 wc_add_notice('Datos Incompletos: Debe especificar el numero de la tarjeta de crédito', 'error');
            }
            else if (!isset($_POST['sitef_gateway-card-type'] )|| $_POST['sitef_gateway-card-type']==''){
                wc_add_notice('El numero de la tarjeta de crédito es invalido', 'error');
            }
            else if  (!isset($_POST['sitef_gateway-id-number'] )|| $_POST['sitef_gateway-id-number']==''){
                wc_add_notice('Datos Incompletos: Debe especificar la cédula de Identidad', 'error');
            }
            else if (!isset($_POST['sitef_gateway-card-expiry'] )|| $_POST['sitef_gateway-card-expiry']==''){
                wc_add_notice('Datos Incompletos: Debe especificar la fecha de expiración de la tarjeta de Crédito', 'error');
            }
            else if (!isset($_POST['sitef_gateway-card-cvc'] )|| $_POST['sitef_gateway-card-cvc']==''){
                wc_add_notice('Datos Incompletos: Debe especificar el código de validación de la tarjeta de crédito', 'error');
            }else{
                $cardNumber = str_replace(array(' ', '-'), '', $_POST['sitef_gateway-card-number']);
                $cardType = $_POST['sitef_gateway-card-type'];
                $idNumber = $_POST['sitef_gateway-id-number'];
                $expiry = str_replace(array('/', ' '), '', $_POST['sitef_gateway-card-expiry']);
                $cvc = (isset($_POST['sitef_gateway-card-cvc'])) ? $_POST['sitef_gateway-card-cvc'] : '';
                $invoiceNumber = str_replace("#", "", $order->get_order_number());
                $ammount = str_replace(array('.', ',', 'Bs F', ' '), '', $order->order_total);

                try {
                    $resp = $this->callSitef($idNumber, $cardNumber, $expiry, $cvc, $cardType, $ammount, $invoiceNumber, $invoiceNumber);

                    if ($resp) {

                        $order->update_status('completed', 'Pago Recibido');

                        // Reduce stock levels
                        $order->reduce_order_stock();

                        // Remove cart
                        WC()->cart->empty_cart();

                        // Return thankyou redirect
                        return array(
                            'result' => 'success',
                            'redirect' => $this->get_return_url($order)
                        );
                    } else {
                        // Transaction was not succesful
                        // Add notice to the cart
                        wc_add_notice($this->msg_error, 'error');
                        // Add note to the order for your reference
                        $order->add_order_note('Error: ' . $this->msg_error);
                    }

                } catch (Exception $e) {
                    // Transaction was not succesful
                    // Add notice to the cart
                    wc_add_notice('Error: ' . $e, 'error');
                    // Add note to the order for your reference
                    $order->add_order_note('Error: ' . $this->msg_error);

                }

            }


        }


        public function callSitef($ccid, $ccnum, $expiry, $cvc, $cctype, $amount, $id, $reference)
        {

            require_once('lib/nusoap/nusoap.php');
            $this->msg_error = '';
            $endpoint = $this->url;

            $wsdl = true;
            $proxyhost = false;
            $proxyport = false;
            $proxyusername = false;

            $proxypassword = false;
            $timeout = 0;
            $response_timeout = 300;

            $client = new nusoap_client($endpoint, $wsdl, $proxyhost, $proxyport, $proxyusername, $proxypassword, $timeout, $response_timeout);

            $err = $client->getError();
            if ($err) {
                $this->msg_error = $err;
                return false;
            }


            $transactionRequest = array('transactionRequest' => array(
                'amount' => $amount,
                'extraField' => '',
                'merchantId' => $this->merchantId,
                'merchantUSN' => $id,
                'orderId' => $reference));

            $payment = $client->getProxy();

            $transactionResponse = $payment->beginTransaction($transactionRequest);

            $nit = $transactionResponse['transactionResponse']['nit'];

            $paymentRequest = array('paymentRequest' => array(
                'authorizerId' => $cctype,
                'autoConfirmation' => 'true',
                'cardExpiryDate' => $expiry,
                'cardNumber' => $ccnum,
                'cardSecurityCode' => $cvc,
                'customerId' => $ccid,
                'extraField' => '',
                'installmentType' => '4',
                'installments' => '1',
                'nit' => $nit));

            $result = null;
            try {
                set_time_limit(90);
                $result = $payment->doPayment($paymentRequest);
                if ($result == null) {
                    for ($i = 1; $i <= 3; $i++) {
                        try {
                            set_time_limit(90);
                            $getStatusRequest = array('merchantKey' => $this->merchantKey, 'nit' => $nit);
                            $result = $payment->getStatus($getStatusRequest);
                            if ($result != null) {
                                break;
                            }
                        } catch (Exception $e) {
                        }
                    }
                }
            } catch (Exception $e) {
                $this->msg_error = 'doPayment Fail';

                for ($i = 1; $i <= 3; $i++) {
                    try {
                        set_time_limit(90);
                        $getStatusRequest = array('merchantKey' => $this->merchantKey, 'nit' => $nit);
                        $result = $payment->getStatus($getStatusRequest);
                    } catch (Exception $e) {
                    }
                }

            }

            if ($result == null) {
                $this->msg_error = 'Se ha perdido la comunicación con la plataforma de pago, por favor, no intente realizar el pago nuevamente y comuniquese con nuestro centro de atención';
                return false;
            }

            if ($client->fault) {
                $this->msg_error = '$client->fault ' . $client->fault;
                return false;
            } else {
                $err = $client->getError();
                if ($err) {
                    return false;
                } else {
                    $responseCode = $result['paymentResponse']['responseCode'];
                    $this->msg_error = '$responseCode ' . $responseCode;

                    switch ($responseCode) {
                        case 9:
                            $this->msg_error = 'Fecha de Expiración de la tarjeta no es valida.';
                            break;
                        case 21:
                            $this->msg_error = 'Documento de Identidad no valido.';
                            break;
                        case 255:
                            $this->msg_error = 'Pago Rechazado / Tarjeta Negada.';
                            break;
                    }

                    return ($responseCode == 0);
                }
            }
        }

    }


    function custom_credit_card_fields_sitef($cc_fields, $payment_id)
    {

        $cc_fields['type-card-field'] = '<input id="' . esc_attr($payment_id) . '-card-type" class="input-text" type="hidden" name="' . $payment_id . '-card-type' . '" />';
        $cc_fields['id-number-field'] = '<p class="form-row form-row-wide">
                                            <label for="' . esc_attr( $payment_id ) . '-id-number">Cédula de Identidad <span class="required">*</span></label>
                                            <input id="' . esc_attr( $payment_id ) . '-id-number" class="input-text" style="font-size: 1.41575em;" inputmode="numeric" autocomplete="off" autocorrect="no" autocapitalize="no" spellcheck="no" maxlength="20" type="tel" name="' . $payment_id . '-id-number" />
                                         </p>';
        $cc_fields['js_function'] = '<script>function getCardType() {if (jQuery( "#'.esc_attr($payment_id).'-card-number" ).hasClass( "visa" )){jQuery( "#'.esc_attr($payment_id).'-card-type" ).val("1");}else if (jQuery( "#'.esc_attr($payment_id).'-card-number" ).hasClass( "mastercard" )){jQuery( "#'.esc_attr($payment_id).'-card-type" ).val("2");}else if (jQuery( "#'.esc_attr($payment_id).'-card-number" ).hasClass( "amex" )){jQuery( "#'.esc_attr($payment_id).'-card-type" ).val("3");}else if (jQuery( "#'.esc_attr($payment_id).'-card-number" ).hasClass( "dinersclub" )){jQuery( "#'.esc_attr($payment_id).'-card-type" ).val("33");}}</script>';
        $cc_fields['card-number-field'] = str_replace('<input ','<input onblur="javascript:getCardType()" ',$cc_fields['card-number-field']);
        $cc_fields['card-cvc-field'] = str_replace('maxlength="4" ','maxlength="5" ',$cc_fields['card-cvc-field']);
        $cc_fields['logos'] = '<img src="../wp-content/plugins/sitef/sitef.png"><img src="../wp-content/plugins/sitef/provincial.png">';

        return $cc_fields;
    }

    function wp_adding_scripts() {
        wp_deregister_script('jquery-payment');
        wp_register_script('jquery-payment', '/wp-content/plugins/sitef/jquery.payment.js' , array( 'jquery' ), '3.0.0', TRUE);
        wp_enqueue_script('jquery-payment');
    }

}