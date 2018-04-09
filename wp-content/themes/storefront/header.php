<?php
/**
 * The header for our theme.
 *
 * Displays all of the <head> section and everything up till <div id="content">
 *
 * @package storefront
 */

?><!doctype html>
<html <?php language_attributes(); ?>>
<head>
<meta charset="<?php bloginfo( 'charset' ); ?>">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1.0, user-scalable=no">
<link rel="profile" href="http://gmpg.org/xfn/11">
<link rel="pingback" href="<?php bloginfo( 'pingback_url' ); ?>">

<link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.0.9/css/all.css" integrity="sha384-5SOiIsAziJl6AWe0HWRKTXlfcSHKmYV4RBF18PPJ173Kzn7jzMyFuTtk8JA7QQG1" crossorigin="anonymous">

<?php wp_head(); ?>
	<!-- Modificacion Ángel Veloz -->
	<style>
		/*.button.wc-forward,
		#site-header-cart{
			display: none !important;
		}*/
		a.showcoupon {
		    color: #0800c2;
		}

		.woocommerce-breadcrumb {
		    margin-bottom: 0px !important;
		}

		.address-field, 
		#billing_company_field {
			display: none !important;
		}

		.single-product div.product .woocommerce-product-gallery,
		.single-product div.product .images, .single-product div.product .summary, .single-product div.product .woocommerce-product-gallery {
		    margin-bottom: 0px !important;
		}

		.single-product div.product .woocommerce-product-gallery {
		    width: 100% !important;
		}

		#primary{
		    width: 100% !important;
		}
		#secondary{
			display: none;
		}

		#main {
		    width: 100%;
		    display: block;
		}

		#main .container_form {
		    margin: 0px auto;
		    max-width: 600px;
		}

		.single-product div.product .summary {
		    width: 100% !important;
		    float: none !important;
		}

		h1.product_title.entry-title {
		    text-align: center;
		}
		.price span.woocommerce-Price-amount.amount {
		    text-align: center;
		    display: block;
		}

		.fechas{
			overflow: hidden;
		}

		.fechas > div {
			float: left;
			width: 50%;
			box-sizing: border-box;
			padding: 10px;
		}

		.fechas > div > input {
			width: 100%;
		    border: solid 1px #b8b8b8;
		    border-radius: 4px;
		    text-align: center;
		    font-size: 18px;
		    padding: 9px;
		    background: #FFF;		
		}
		.single-product div.product form.cart {
		    padding: 0px;
		}

		.single-product div.product p.price {
		    margin: 0px;
		}
		
		.cantidad_container {
			border: solid 1px #CCC;
			border-radius: 3px;
			box-shadow: inset 0 1px 1px rgba(0,0,0,.125);
			margin: 0px 10px 10px;
			overflow: hidden;
		}

		.cantidad_container > div {
			float: left;
			padding: 15px;
		    font-size: 20px;
		}

		.cantidad_max {
		    float: right !important;
		}

		.cantidad_container span {
			display: inline-block;
			padding: 0px 10px;
		}

		.cantidad_box{
		}

		.cantidad_box i {
		    cursor: pointer;
		    color: #33e1be;
		}

		.wc-bookings-booking-form .form-field {
		    margin: 0px;
		}

		button.wc-bookings-booking-form-button.single_add_to_cart_button {
		    width: calc( 100% - 22px );
		    display: block;
		    margin: 0px auto;
		    border-radius: 3px;
		    padding: 10px !important;
		    font-size: 20px;
		}

		.cart_container {
		    width: 100%;
		    display: block;
		    margin: 0px auto;
		    max-width: 600px;
		}

		.cart_container .item_cart {
			overflow: hidden;
			border-bottom: solid 1px #CCC;
			padding: 5px;
			margin-bottom: 10px;
		}

		.cart_container .item_cart > div {
			overflow: hidden;
		}

		.cart_container .item_cart .product_name {
			font-weight: 600;
		    text-transform: uppercase;
		}

		.cart_container .item_cart .product_precio,
		.cart_container .item_cart .product_fecha {
			padding-left: 10px; 
		}

		.cart_container .item_cart .product_fecha > label {
			font-weight: 600;
			text-transform: uppercase;
		}

		.cart_container .item_cart > div > span {
			float: right;
		}

	</style>
</head>

<body <?php body_class(); ?>>

<?php do_action( 'storefront_before_site' ); ?>

<div id="page" class="hfeed site">
	<?php do_action( 'storefront_before_header' ); ?>

	<header id="masthead" class="site-header" role="banner" style="<?php storefront_header_styles(); ?>">
		<div class="col-full">

			<?php
			/**
			 * Functions hooked into storefront_header action
			 *
			 * @hooked storefront_skip_links                       - 0
			 * @hooked storefront_social_icons                     - 10
			 * @hooked storefront_site_branding                    - 20
			 * @hooked storefront_secondary_navigation             - 30
			 * @hooked storefront_product_search                   - 40
			 * @hooked storefront_primary_navigation_wrapper       - 42
			 * @hooked storefront_primary_navigation               - 50
			 * @hooked storefront_header_cart                      - 60
			 * @hooked storefront_primary_navigation_wrapper_close - 68
			 */
			do_action( 'storefront_header' ); ?>

		</div>
	</header><!-- #masthead -->

	<?php
	/**
	 * Functions hooked in to storefront_before_content
	 *
	 * @hooked storefront_header_widget_region - 10
	 */
	do_action( 'storefront_before_content' ); ?>

	<div id="content" class="site-content" tabindex="-1">
		<div class="col-full">

		<?php
		/**
		 * Functions hooked in to storefront_content_top
		 *
		 * @hooked woocommerce_breadcrumb - 10
		 */
		do_action( 'storefront_content_top' );
