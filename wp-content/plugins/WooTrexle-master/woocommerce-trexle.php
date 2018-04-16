<?php
/*
Plugin Name: WooCommerce Trexle Payments Gateways
Plugin URI: https://trexle.com
Description: Use Trexle Payments Gateways to process credit cards for WooCommerce.
Version: 1.1
Author: Hossam Hossny
Author URI: https://hoss.am/

Copyright: © 2016 Hossam Hossny

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License, version 2, as
published by the Free Software Foundation.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
*/

/**
 * Required functions
 */
if ( ! function_exists( 'woothemes_queue_update' ) )
	require_once( 'woo-includes/woo-functions.php' );

add_action('plugins_loaded', 'woocommerce_trexle_payments_init', 0);

function woocommerce_trexle_payments_init() {

	if (!class_exists('WC_Payment_Gateway'))  return;

	class WC_Gateway_Trexle_Payments extends WC_Payment_Gateway {

		public function __construct() {
			global $woocommerce;

		    $this->id 					= 'trexle_payments';
		    $this->method_title 		= __('Trexle', 'woo_trexle_payments');
			$this->method_description 	= __('Use Trexle Payments Gateways to process credit cards for WooCommerce.', 'woo_trexle_payments');
			$this->icon 				= plugins_url() . "/" . plugin_basename( dirname(__FILE__)) . '/images/trexle.png';
			$this->supports 			= array('subscriptions', 'default_credit_card_form', 'products', 'subscription_cancellation', 'subscription_reactivation', 'subscription_suspension', 'subscription_date_changes','subscription_amount_changes','subscription_payment_method_change', 'subscription_payment_method_change_customer','subscription_payment_method_change_admin', 'multiple_subscriptions', 'refunds' );
			$this->view_transaction_url = 'https://core.trexle.com/api/v1/charges/%s';

		    // Load the form fields.
		    $this->init_form_fields();

		    // Load the settings.
		    $this->init_settings();

		    // Define user set variables
		    $this->title = $this->settings['title'];
		    $this->description = __('Pay using credit card','woo_trexle_payments');
		    $this->trexle_url = 'https://core.trexle.com/api/v1/';

			// Save admin options
			add_action( 'woocommerce_update_options_payment_gateways', array( &$this, 'process_admin_options' ) ); // 1.6.6
			add_action( 'woocommerce_update_options_payment_gateways_' . $this->id, array( $this, 'process_admin_options' ) ); // 2.0.0

		    add_action('admin_notices', array(&$this, 'ssl_check'));
			add_action('woocommerce_update_options_payment_gateways', array( &$this, 'process_admin_options' ) );
			add_action('wp_enqueue_scripts', array(&$this,'load_checkout_script'));

			// Add Card Name field to credit card form
			add_filter('woocommerce_credit_card_form_fields', array($this,'add_card_name_field'));
			add_action( 'wp_enqueue_scripts', array($this,'add_card_name_field_styles'));

		}


		/**
		 * Load checkout script to determine which credit card type is being entered
		 */
		function load_checkout_script() {
			if (is_checkout()) {
				$script_url = 'https://cdn.trexle.com/trexle.js';
				wp_enqueue_script('woo_trexle_payments_script',$script_url,array('jquery','woocommerce','wc-checkout'),false,true);


				$public_key = $this->settings['public-key-live'];
				wp_localize_script('woo_trexle_payments_script', 'WooTrexle', array( 'public_key' => $public_key,'plugin_url'=>plugins_url()."/" . plugin_basename( dirname(__FILE__))));

				wp_enqueue_script('woo_trexle_payments_script_local',plugins_url() . "/" . plugin_basename( dirname(__FILE__)) . '/woocommerce-trexle.js',array('jquery','woocommerce','wc-checkout','woo_trexle_payments_script'),false,true);
			}
		}


        /**
         * Check if SSL is enabled and notify the user
         * */
        function ssl_check() {
            if (get_option('woocommerce_force_ssl_checkout') == 'no' && $this->enabled == 'yes') :
                echo '<div class="error"><p>' . sprintf(__('Trexle Payments is enabled, but the <a href="%s">force SSL option</a> is disabled; your checkout is not secure! Please enable SSL and ensure your server has a valid SSL certificate.', 'woo_trexle_payments'), admin_url('admin.php?page=wc-settings&tab=checkout')) . '</p></div>';
            endif;
        }


		/**
	     * Initialise Gateway Settings Form Fields
		 *
		 * @since 1.0.0
	     */
		function init_form_fields() {
			$this->form_fields = array(
			    'enabled' => array(
			        'title' => __( 'Enable/Disable', 'woo_trexle_payments' ),
			        'type' => 'checkbox',
			        'label' => __( 'Enable this payment method', 'woo_trexle_payments' ),
			        'default' => 'yes'
			    ),
			    'title' => array(
			        'title' => __( 'Title', 'woo_trexle_payments' ),
			        'type' => 'text',
			        'description' => __( 'This controls the title which the user sees during checkout.', 'woo_trexle_payments' ),
			        'default' => __( 'Trexle', 'woo_trexle_payments' )
			    ),
				'disable-stored-cards' => array(
					'title' => __( 'Disable Saved Cards', 'woo_trexle_payments' ),
					'label' => __( 'Disable Saved Cards', 'woo_trexle_payments' ),
					'type' => 'checkbox',
					'description' => __( 'Saved Cards allows logged in customers to use previously entered credit cards (details stored at Trexle).', 'woo_trexle_payments' ),
					'default' => 'no'
				),
				'public-key-live' => array(
					'title' => __( 'Public API Key', 'woo_trexle_payments' ),
					'type' => 'text',
					'description' => __( 'Your Public API key. This can be obtained at <a href="https://trexle.com">Trexle</a>.', 'woo_trexle_payments' ),
					'default' => ''
				),
				'secret-key-live' => array(
					'title' => __( 'Secret API Key', 'woo_trexle_payments' ),
					'type' => 'password',
					'description' => __( 'Your Secret API key. This can be obtained at <a href="https://trexle.com">Trexle</a>.', 'woo_trexle_payments' ),
					'default' => ''
				)
			);
		} // End init_form_fields()


		/**
		 * Admin Panel Options
		 *
		 * @since 1.0.0
		 */
		public function admin_options() { ?>
	    	<h3><?php _e('Trexle Payments Gateways', 'woo_trexle_payments'); ?></h3>
	    	<table class="form-table">
	    	<?php
	    		// Generate the HTML For the settings form.
	    		$this->generate_settings_html();
	    	?>
			</table><!--/.form-table-->
	    	<?php
	    } // End admin_options()


		/**
         * Payment Form
         */
        function payment_fields() {
			global $woocommerce;

			$showbillingfields = false;
			if (isset($_GET['order_id'])) {
				$showbillingfields = true;
				$order = new WC_Order((int) $_GET['order_id']);
				$addressline1 = $order->billing_address_1;
				$addressline2 = $order->billing_address_2;
				$city = $order->billing_city;
				$state = $order->billing_state;
				$postcode = $order->billing_postcode;
				$country = $order->billing_country;
			}

			// Payment form
			if ($this->description) { echo '<p>'.$this->description.'</p>'; }

			$timestamp = gmdate('YmdHis');


			 /* These fields are required by the JS to retreive the Trexle card token.
			They don't need to be submitted to the browser, so don't need name attributes. */
			if ($showbillingfields) { ?>
				<input id='billing_address_1' type="hidden" value="<?php echo $order->billing_address_1; ?>" />
	    		<input id='billing_address_2' type="hidden" value="<?php echo $order->billing_address_2; ?>" />
				<input id='billing_city' type="hidden" value="<?php echo $order->billing_city; ?>" />
	   			<input id='billing_state' type="hidden" value="<?php echo $order->billing_state; ?>" />
	    		<input id='billing_postcode' type="hidden" value="<?php echo $order->billing_postcode; ?>" />
	   			<input id='billing_country' type="hidden" value="<?php echo $order->billing_country; ?>" />
   			<?php } ?>
   			<div class='errors' style='display:none'>
    			<h3></h3>
    			<ul></ul>
  			</div>

			<fieldset>
				<?php if ( $this->settings['disable-stored-cards'] != "yes" && is_user_logged_in() && ( $credit_cards = get_user_meta( get_current_user_id(), '_trexle_customer_token', false ) ) ) : ?>
					<p class="form-row form-row-wide">

						<a class="button" style="float:right;" href="<?php echo get_permalink( get_option( 'woocommerce_myaccount_page_id' ) ); ?>#saved-cards"><?php _e( 'Manage cards', 'woo_trexle_payments' ); ?></a>

						<?php foreach ( $credit_cards as $i => $credit_card ) : ?>
							<input type="radio" id="trexle_card_<?php echo $i; ?>" name="trexle_customer_token" style="width:auto;" value="<?php echo $i; ?>" />
							<label style="display:inline;" for="trexle_card_<?php echo $i; ?>"><?php _e( 'Card ending with', 'woo_trexle_payments' ); ?> <?php echo substr($credit_card['display_number'],-4,4); ?> (<?php echo get_full_card_scheme_name($credit_card['scheme']) ?>)</label><br />
						<?php endforeach; ?>

						<input type="radio" id="new" name="trexle_customer_token" style="width:auto;" <?php checked( 1, 1 ) ?> value="new" /> <label style="display:inline;" for="new"><?php _e( 'Use a new credit card', 'woo_trexle_payments' ); ?></label>

					</p>
					<div class="clear"></div>
				<?php $has_cards = true;
				endif; ?>
				<div class="trexle_new_card <?php if (isset($has_cards) && $has_cards == true) echo 'has_cards'; ?>">
					<?php $this->credit_card_form(); ?>
				</div>
				<div class="clear"></div>
			</fieldset>
		<?php
        }


        /**
         * Add a Card Name field to the default WooCommerce checkout form (and make it first)
         */
        function add_card_name_field($default_fields) {
        	$fields = array_merge(array('card-name-field' => '<p class="form-row form-row-wide">
				<label for="' . esc_attr( $this->id ) . '-card-name">' . __( 'Name on card', 'woo_trexle_payments' ) . ' <span class="required">*</span></label>
				<input id="' . esc_attr( $this->id ) . '-card-name" class="input-text wc-credit-card-form-card-name" type="text" autocomplete="off" placeholder="" name="' . $this->id . '-card-name' . '" />
			</p>'),$default_fields);
        	return $fields;
        }

        function add_card_name_field_styles() {
        	if (is_checkout()) {
				wp_register_style( 'woocommerce-trexle-payments', plugin_dir_url(__FILE__) . 'woocommerce-trexle.css' );
				wp_enqueue_style( 'woocommerce-trexle-payments' );
			}
        }

		/**
		 * Process the payment and return the result
		 *
		 * @since 1.0.0
		 */
		function process_payment( $order_id ) {
			global $woocommerce;
			$order = new WC_Order( $order_id );

			$card_token = isset( $_POST['card_token'] ) ? woocommerce_clean( $_POST['card_token'] ) : '';
			$ip_address = isset( $_POST['ip_address'] ) ? woocommerce_clean( $_POST['ip_address'] ) : '';
			$secret_key = $this->settings['secret-key-live'];

			// Are we paying by customer token?
			if ( isset( $_POST['trexle_customer_token'] ) && $_POST['trexle_customer_token'] !== 'new' && is_user_logged_in() ) {
				$customer_tokens = get_user_meta( get_current_user_id(), '_trexle_customer_token', false );

				if ( isset( $customer_tokens[ $_POST['trexle_customer_token'] ]['customer_token'] ) )
					$customer_token = $customer_tokens[ $_POST['trexle_customer_token'] ]['customer_token'];
				else
					wc_add_notice(__( 'Invalid card.', 'woo_trexle_payments' ),'error');
			} elseif (empty($card_token)) {
				wc_add_notice(__('Please make sure your card details have been entered correctly and that your browser supports JavaScript.', 'woo_trexle_payments' ),'error');
			}

			// Save token if logged in
			if ( is_user_logged_in() && !isset($customer_token) && isset($card_token) ) {
				// We need to turn the card token into a Customer token for later use.
				$customer_token = $this->create_trexle_customer( $order, $card_token );
			}

			$order_description = sprintf( __( '%s - Order #%s', 'woocommerce' ), esc_html( get_bloginfo( 'name', 'display' ) ), $order->get_order_number() );

		    $post_data = array(
		    	'email'=>$order->billing_email,
		    	'description'=>$order_description,
		    	'amount'=>number_format( (float)$order->order_total * 100, 0, '.', '' ),
		    	'currency'=>get_woocommerce_currency(),
		    	'ip_address'=>$ip_address
		    	);
		    if (isset($customer_token)) {
		    	$post_data['customer_token'] = $customer_token;
		    } else {
		    	$post_data['card_token'] = $card_token;
		    }

		    $result = $this->call_trexle($post_data,'charges');

		    if (isset($result->response->success) && $result->response->success == 1) {
		    	// Success
	    		$order->add_order_note(sprintf(__('Trexle payment on card %s approved at %s. Reference ID: %s','woo_trexle_payments'),$result->response->card->display_number,$result->response->created_at,$result->response->token));
	    		$order->payment_complete($result->response->token);
	    		$woocommerce->cart->empty_cart();

	    		if (is_woocommerce_pre_2_1()) {
	    			$redirect = add_query_arg('key', $order->order_key, add_query_arg('order', $order_id, get_permalink(get_option('woocommerce_thanks_page_id'))));
	    		} else { // WC 2.1+
	    			$redirect = $this->get_return_url($order);
	    		}
                return array(
                    'result' => 'success',
                    'redirect' => $redirect
                );

	        } elseif (isset($result->response->success) && $result->response->success != 1) {
	        	// Failed
            	$order->add_order_note(sprintf(__('Trexle payment failed: %s. (ref ID: %s)', 'woo_trexle_payments'), $result->response->error_message, $result->response->token));
                wc_add_notice(__('Payment error: ', 'woo_trexle_payments') . $result->response->error_message,'error');

            } else {
            	// Errored
            	$order->add_order_note(sprintf(__('Trexle Payments error: %s', 'woo_trexle_payments'), $result->error_description));
                wc_add_notice(__('Payment error: ', 'woo_trexle_payments') . $result->error_description,'error');
            }
	        return array(
	            'result' => 'failure',
	            'redirect' => $order->get_checkout_payment_url(true)
      		);
		}

		function create_trexle_customer($order,$card_token) {
			global $woocommerce;

			if (is_user_logged_in() && $card_token) {

				$post_data = array(
					'email'=>$order->billing_email,
					'card_token'=>$card_token);

				$result = $this->call_trexle($post_data,'customers');

				if (isset($result->response->token) && !empty($result->response->token)) {
					$customer_token = array(
						'customer_token'=>$result->response->token,
						'display_number'=>$result->response->card->display_number,
						'scheme'=>$result->response->card->scheme,
						'email'=>$result->response->email
					);
					if ($this->settings['disable-stored-cards'] != "yes") {
						add_user_meta(get_current_user_id(),'_trexle_customer_token',$customer_token);
					}
					return $result->response->token;
				}
			}
		}

		function call_trexle($post_data,$action='charges') {
			global $woocommerce;

			$secret_key = $this->settings['secret-key-live'];

			$response = wp_remote_post( $this->trexle_url.$action , array(
   				'method'		=> 'POST',
   				'headers' => array(
					'Authorization' => 'Basic ' . base64_encode( $secret_key . ':' )
				),
    			'body' 			=> $post_data,
    			'timeout' 		=> 70,
    			'user-agent' 	=> 'WooCommerce ' . $woocommerce->version
			));
			$result = json_decode($response['body']);
			return $result;
		}

		public function process_refund($order_id, $amount = null, $reason = '') {

			$charge_token = get_post_meta( $order_id, '_transaction_id', true );
			if (!$charge_token) return new WP_Error('no_charge_token','Sorry, this order does not have a charge token saved. It may have been processed by an earlier version of the Trexle Payments plugin and cannot process a refund.');
			$post_data = array('amount'=>($amount*100));
		    $result = $this->call_trexle($post_data,'charges/'.$charge_token.'/refunds');

		    $order = new WC_Order($order_id);

		    if (isset($result->response)) {
		    	// Refund was successful
		    	$order->add_order_note(sprintf(__('Trexle Payments refund was processed for $%s at %s. Reference ID: %s','woo_trexle_payments'),($result->response->amount/100),$result->response->created_at,$result->response->token));
		    	return 1;
		    } elseif (isset($result->error)) {
		    	// Refund was not successful
		    	$errors = '';
		    	foreach ($result->messages as $i => $msg) {
		    		if ($i > 0) $errors .= ', ';
		    		$errors .= $msg->message;
		    	}
		    	$order->add_order_note(sprintf(__('Trexle Payments refund was NOT processed due to: %s.','woo_trexle_payments'),$errors));
		    	return 0;
		    }

		    $order->add_order_note(sprintf(__('Trexle Payments refund response: %s','woo_trexle_payments'),print_r($result,true)));
		    return new WP_Error('invalid_refund_response','Sorry, we couldn\'t understand the refund response from Trexle. It has been saved as an order note.');
		}

	}

	function get_full_card_scheme_name($scheme) {
		switch ($scheme) {
			case 'visa':
				return 'VISA';
			case 'master':
				return 'Mastercard';
			case 'american_express':
				return 'American Express';
			default :
				return '';
		}
	}

	/**
	 * account_cc function.
	 *
	 * @access public
	 * @return void
	 */
	function woocommerce_trexle_saved_cards() {
		$credit_cards = get_user_meta( get_current_user_id(), '_trexle_customer_token', false );

		$gateway = new WC_Gateway_Trexle_Payments();
		if ( ! $credit_cards || $gateway->settings['disable-stored-cards'] == "yes")
			return;

        if ( isset( $_POST['delete_card'] ) && wp_verify_nonce( $_POST['_wpnonce'], "trexle_del_card" ) ) {
			$credit_card = $credit_cards[ (int) $_POST['delete_card'] ];
			delete_user_meta( get_current_user_id(), '_trexle_customer_token', $credit_card );
		}

		$credit_cards = get_user_meta( get_current_user_id(), '_trexle_customer_token', false );

		if ( ! $credit_cards )
			return;
		?>
			<h2 id="saved-cards" style="margin-top:40px;"><?php _e('Saved cards', 'woo_trexle_payments' ); ?></h2>
			<table class="shop_table">
				<thead>
					<tr>
						<th><?php _e('Card ending in...','woo_trexle_payments'); ?></th>
						<th><?php _e('Card type','woo_trexle_payments'); ?></th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					<?php foreach ( $credit_cards as $i => $credit_card ) : ?>
					<tr>
                        <td><?php esc_html_e(substr($credit_card['display_number'],-4,4)); ?></td>
                        <td><?php echo get_full_card_scheme_name(esc_html($credit_card['scheme'])); ?></td>
						<td>
                            <form action="#saved-cards" method="POST">
                                <?php wp_nonce_field ( 'trexle_del_card' ); ?>
                                <input type="hidden" name="delete_card" value="<?php echo (int) $i; ?>">
                                <input type="submit" class="button" value="<?php _e( 'Delete card', 'woo_trexle_payments' ); ?>">
                            </form>
						</td>
					</tr>
					<?php endforeach; ?>
				</tbody>
			</table>
		<?php
	}

	add_action( 'woocommerce_after_my_account', 'woocommerce_trexle_saved_cards' );

	if (!function_exists('is_woocommerce_pre_2_1')) {
		function is_woocommerce_pre_2_1() {
	        if ( ! defined( 'WC_VERSION' ) ) {
	            $woocommerce_is_pre_2_1 = true;
	        } else {
	            $woocommerce_is_pre_2_1 = false;
	        }
	        return $woocommerce_is_pre_2_1;
	    }
	}



	if ( class_exists( 'WC_Subscriptions_Order' ) ) {
		include_once( 'woocommerce-trexle-subscriptions.php' );

		// Support for WooCommerce Subscriptions 1.n
		if ( ! function_exists( 'wcs_create_renewal_order' ) ) {
			include_once( 'woocommerce-trexle-subscriptions-deprecated.php' );
		}
	}

	/**
	 * Add the Trexle Payments gateway to WooCommerce
	 *
	 * @since 1.0.0
	 **/
	function add_Trexle_Payments_gateway( $methods ) {
		if ( class_exists( 'WC_Subscriptions_Order' ) ) {
			if ( class_exists( 'WC_Subscriptions_Order' ) && !function_exists( 'wcs_create_renewal_order' ) ) {
				$methods[] = 'WC_Gateway_Trexle_Payments_Subscriptions_Deprecated';
			} else {
				$methods[] = 'WC_Gateway_Trexle_Payments_Subscriptions';
			}
		} else {
			$methods[] = 'WC_Gateway_Trexle_Payments';
		}
		return $methods;
	}
	add_filter('woocommerce_payment_gateways', 'add_Trexle_Payments_gateway' );

}