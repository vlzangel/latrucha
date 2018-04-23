<?php
	/**
	 * Template Name: Cart
	 */

	get_header();
		
		echo do_shortcode( '[woocommerce_cart]' );

		if( !WC()->cart->is_empty () ){ ?>

			<h1 class='titulo_h1'>RESUMEN DE TU RESERVA</h1>

		    <div class="cart_container"> <?php

				foreach ( WC()->cart->get_cart() as $cart_item_key => $cart_item ) {
					echo getInfoCart($cart_item, $cart_item_key);
				}

				echo getTotalCart(); ?>

			</div> <?php

		} 

	get_footer();

?>
