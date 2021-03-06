<?php
	
	wp_enqueue_style( 'vlz_styles', get_template_directory_uri()."/vlz/styles.css?v=".time(), array("storefront-style"), "1.0.0" );
	wp_enqueue_script( 'vlz_script', get_template_directory_uri()."/vlz/scripts.js?v=".time(), array("jquery") );

	function moneda($valor){
		return "Bs F ".number_format($valor, 2, ',', '.');
	}

	add_filter ('add_to_cart_redirect', 'redirect_to_checkout');
	function redirect_to_checkout() {
		global $woocommerce;
		// $checkout_url = $woocommerce->cart->get_checkout_url();
		$checkout_url = $woocommerce->cart->get_cart_url();
		return $checkout_url;
	}

	/**
	 * Actualiza la información del pedido con el nuevo campo
	 */
	add_action( 'woocommerce_checkout_update_order_meta', 'guardar_encuesta' );
	function guardar_encuesta( $order_id ) {
	    if ( ! empty( $_POST['encuesta'] ) ) {
	        update_post_meta( $order_id, 'encuesta', sanitize_text_field( $_POST['encuesta'] ) );
	    }
	}

	add_filter( 'woocommerce_checkout_fields' , 'set_input_attrs' );
	function set_input_attrs( $fields ) {
		/*$fields['billing']['billing_address_1']["required"] = false;
		$fields['billing']['billing_address_2']["required"] = false;
		$fields['billing']['billing_city']["required"] = false;
		$fields['billing']['billing_state']["required"] = false;
		$fields['billing']['billing_postcode']["required"] = false;*/

		unset($fields['billing']['billing_address_1']);
		unset($fields['billing']['billing_address_2']);
		unset($fields['billing']['billing_city']);
		unset($fields['billing']['billing_state']);
		unset($fields['billing']['billing_postcode']);
		unset($fields['billing']['billing_company']);
		//unset($fields['billing']['billing_phone']);
		unset($fields['shipping']);
		unset($fields['order']["order_comments"]);

		/*echo "<pre style='font-size: 11px;'>";
			print_r($fields);
		echo "</pre>";*/

	   	return $fields;
	}

	function getInfoCart($cart_item, $cart_item_key, $checkout = ""){
		$_product   = apply_filters( 'woocommerce_cart_item_product', $cart_item['data'], $cart_item, $cart_item_key );
		$product_id = apply_filters( 'woocommerce_cart_item_product_id', $cart_item['product_id'], $cart_item, $cart_item_key );
		$nombre_producto = "";
		if ( ! $product_permalink ) {
			$nombre_producto = apply_filters( 'woocommerce_cart_item_name', $_product->get_name(), $cart_item, $cart_item_key ) . '&nbsp;';
		} else {
			$nombre_producto = apply_filters( 'woocommerce_cart_item_name', sprintf( '<a href="%s">%s</a>', esc_url( $product_permalink ), $_product->get_name() ), $cart_item, $cart_item_key );
		}
		$personas = "";
		if( isset($cart_item["booking"]["_persons"][0]) ){
			$plural = ""; if( $cart_item["booking"]["_persons"][0] > 1 ){ $plural = "s"; }
			$personas = $cart_item["booking"]["_persons"][0]." persona{$plural} - ";
		}
		$cart_item["booking"]["duration"] = str_replace("Dia", "Noche", $cart_item["booking"]["duration"]);
		$cart_item["booking"]["duration"] = str_replace("día", "Noche", $cart_item["booking"]["duration"]);
		$precio_base = moneda(get_post_meta($product_id, '_wc_booking_base_cost', true));
		$sub_total = apply_filters( 'woocommerce_cart_item_subtotal', WC()->cart->get_product_subtotal( $_product, $cart_item['quantity'] ), $cart_item, $cart_item_key );
		
		$inicio = date("d/m/Y", $cart_item["booking"]["_start_date"]);
		$fin = date("d/m/Y", $cart_item["booking"]["_end_date"]);

		$url_remove = " 
			href='".esc_url( WC()->cart->get_remove_url( $cart_item_key ) )."'
		";

		if( $checkout == "" ){
			return "
				<div class='item_cart'> 
					<div class='product_name'>{$nombre_producto}</div>

					<div class='product_box'>
						<div class='product_fecha'>
							<label>Fecha</label> <span> {$inicio} > {$fin} </span> 
						</div>
						<div class='product_precio'>
							{$personas}{$cart_item["booking"]["duration"]} - {$precio_base} <span>{$sub_total}</span> 
						</div>
					</div>
					<div class='product_trast'>
						<a {$url_remove} > <i class='far fa-trash-alt'></i> </a>
					</div>
				</div>";	
		}else{
			return "
				<div class='item_cart'> 
					<div class='product_name'>{$nombre_producto}</div>

					<div class='product_box' style='width: 100%;'>
						<div class='product_fecha'>
							<label>Fecha</label> <span> {$inicio} > {$fin} </span> 
						</div>
						<div class='product_precio'>
							{$personas}{$cart_item["booking"]["duration"]} - {$precio_base} <span>{$sub_total}</span> 
						</div>
					</div>
				</div>";	
		}
	}

	function getTotalCart($checkout = ""){ ?>

		<?php if( $checkout == "" ){ ?>
			<?php if ( wc_coupons_enabled() ) { ?>
				<form id="vlz_form_cupon">
					<input class="form_cupon_input" type="text" id="cupon" name="cupon" placeholder="Ingrese su cup&oacute;n" />
					<input class="form_cupon_boton" type="submit" value="Aplicar Cup&oacute;n">
				</form>
				<div id="mensaje_cupon">
					
				</div>
			<?php } ?>
		<?php } ?>

		<div class="cart_totals <?php echo ( WC()->customer->has_calculated_shipping() ) ? 'calculated_shipping' : ''; ?>">

			<?php do_action( 'woocommerce_before_cart_totals' ); ?>

			<div style='font-weight: 600; text-transform: uppercase;'><?php _e( 'Total a Pagar', 'woocommerce' ); ?></div>

			<table cellspacing="0" class="shop_table shop_table_responsive vlz_totales">

				<tr class="cart-subtotal">
					<th><?php _e( 'Subtotal', 'woocommerce' ); ?></th>
					<td data-title="<?php esc_attr_e( 'Subtotal', 'woocommerce' ); ?>"><?php wc_cart_totals_subtotal_html(); ?></td>
				</tr>

				<?php foreach ( WC()->cart->get_coupons() as $code => $coupon ) : ?>
					<tr class="cart-discount coupon-<?php echo esc_attr( sanitize_title( $code ) ); ?>">
						<th><?php wc_cart_totals_coupon_label( $coupon ); ?></th>
						<?php if( $checkout == "" ){ ?>
							<td data-title="<?php echo esc_attr( wc_cart_totals_coupon_label( $coupon, false ) ); ?>"><?php wc_cart_totals_coupon_html( $coupon ); ?></td>
						<?php }else{ ?>
							<td data-title="<?php echo esc_attr( wc_cart_totals_coupon_label( $coupon, false ) ); ?>"><?php vlz_wc_cart_totals_coupon_html( $coupon ); ?></td>
						<?php } ?>
					</tr>
				<?php endforeach; ?>

				<?php if ( WC()->cart->needs_shipping() && WC()->cart->show_shipping() ) : ?>

					<?php do_action( 'woocommerce_cart_totals_before_shipping' ); ?>

					<?php wc_cart_totals_shipping_html(); ?>

					<?php do_action( 'woocommerce_cart_totals_after_shipping' ); ?>

				<?php elseif ( WC()->cart->needs_shipping() && 'yes' === get_option( 'woocommerce_enable_shipping_calc' ) ) : ?>

					<tr class="shipping">
						<th><?php _e( 'Shipping', 'woocommerce' ); ?></th>
						<td data-title="<?php esc_attr_e( 'Shipping', 'woocommerce' ); ?>"><?php woocommerce_shipping_calculator(); ?></td>
					</tr>

				<?php endif; ?>

				<?php foreach ( WC()->cart->get_fees() as $fee ) : ?>
					<tr class="fee">
						<th><?php echo esc_html( $fee->name ); ?></th>
						<td data-title="<?php echo esc_attr( $fee->name ); ?>"><?php wc_cart_totals_fee_html( $fee ); ?></td>
					</tr>
				<?php endforeach; ?>

				<?php if ( wc_tax_enabled() && 'excl' === WC()->cart->tax_display_cart ) :
					$taxable_address = WC()->customer->get_taxable_address();
					$estimated_text  = WC()->customer->is_customer_outside_base() && ! WC()->customer->has_calculated_shipping()
							? sprintf( ' <small>' . __( '(estimated for %s)', 'woocommerce' ) . '</small>', WC()->countries->estimated_for_prefix( $taxable_address[0] ) . WC()->countries->countries[ $taxable_address[0] ] )
							: '';

					if ( 'itemized' === get_option( 'woocommerce_tax_total_display' ) ) : ?>
						<?php foreach ( WC()->cart->get_tax_totals() as $code => $tax ) : ?>
							<tr class="tax-rate tax-rate-<?php echo sanitize_title( $code ); ?>">
								<th><?php echo esc_html( $tax->label ) . $estimated_text; ?></th>
								<td data-title="<?php echo esc_attr( $tax->label ); ?>"><?php echo wp_kses_post( $tax->formatted_amount ); ?></td>
							</tr>
						<?php endforeach; ?>
					<?php else : ?>
						<tr class="tax-total">
							<th><?php echo esc_html( WC()->countries->tax_or_vat() ) . $estimated_text; ?></th>
							<td data-title="<?php echo esc_attr( WC()->countries->tax_or_vat() ); ?>"><?php wc_cart_totals_taxes_total_html(); ?></td>
						</tr>
					<?php endif; ?>
				<?php endif; ?>

				<?php do_action( 'woocommerce_cart_totals_before_order_total' ); ?>

				<tr class="order-total">
					<th><?php _e( 'Total', 'woocommerce' ); ?></th>
					<td data-title="<?php esc_attr_e( 'Total', 'woocommerce' ); ?>"><?php wc_cart_totals_order_total_html(); ?></td>
				</tr>

				<?php do_action( 'woocommerce_cart_totals_after_order_total' ); ?>

			</table>

			<?php if( $checkout == "" ){ ?>
				<div class="wc-proceed-to-checkout">
					<?php do_action( 'woocommerce_proceed_to_checkout' ); ?>
				</div>
			<?php } ?>

			<?php do_action( 'woocommerce_after_cart_totals' ); ?>

		</div> <?php 
	}

	// Cambia texto del botón ir a la caja
	remove_action( 'woocommerce_proceed_to_checkout', 'woocommerce_button_proceed_to_checkout', 20 );
	add_action( 'woocommerce_proceed_to_checkout', 'cambia_texto_boton_ir_a_pagina_pago' );
	function cambia_texto_boton_ir_a_pagina_pago() {
	    $checkout_url = WC()->cart->get_checkout_url(); ?>
	    <a href="<?php echo $checkout_url; ?>" class="checkout-button button alt"><?php _e( 'Procesar Pago', 'woocommerce' ); ?></a> <?php
	}

?>