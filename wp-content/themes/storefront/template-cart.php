<?php
	/**
	 * Template Name: Cart
	 */

	get_header();
		
		echo do_shortcode( '[woocommerce_cart]' );

		if( !WC()->cart->is_empty () ){ ?>

			<h1 class='titulo_h1'>RESUMEN DE TU RESERVA</h1>

		    <div class="cart_container">
				<?php

					foreach ( WC()->cart->get_cart() as $cart_item_key => $cart_item ) {
						echo getInfoCart($cart_item, $cart_item_key);
					}

					echo getTotalCart();

					$available_gateways = WC()->payment_gateways->get_available_payment_gateways(); ?>

					<div id="payment" class="woocommerce-checkout-payment">
						<?php if ( WC()->cart->needs_payment() ) : ?>
							<ul class="wc_payment_methods payment_methods methods">
								<?php
									if ( ! empty( $available_gateways ) ) {
										foreach ( $available_gateways as $gateway ) {
											wc_get_template( 'checkout/payment-method.php', array( 'gateway' => $gateway ) );
										}
									} else {
										echo '<li class="woocommerce-notice woocommerce-notice--info woocommerce-info">' . apply_filters( 'woocommerce_no_available_payment_methods_message', WC()->customer->get_billing_country() ? __( 'Sorry, it seems that there are no available payment methods for your state. Please contact us if you require assistance or wish to make alternate arrangements.', 'woocommerce' ) : __( 'Please fill in your details above to see available payment methods.', 'woocommerce' ) ) . '</li>';
									}
								?>
							</ul>
						<?php endif; ?>
						<div class="form-row place-order">
							<noscript>
								<?php _e( 'Since your browser does not support JavaScript, or it is disabled, please ensure you click the <em>Update Totals</em> button before placing your order. You may be charged more than the amount stated above if you fail to do so.', 'woocommerce' ); ?>
								<br/><input type="submit" class="button alt" name="woocommerce_checkout_update_totals" value="<?php esc_attr_e( 'Update totals', 'woocommerce' ); ?>" />
							</noscript>

							<?php wc_get_template( 'checkout/terms.php' ); ?>
							
						</div>
					</div> 

			</div> <?php

		} 

	get_footer();

?>
