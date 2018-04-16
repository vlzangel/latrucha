jQuery( document ).ready( function() {

	jQuery("#vlz_form_cupon").on("submit", function(e){
		aplicarCupon( jQuery(this).children(".form_cupon_input").val() );

		e.preventDefault();
	});

	if( jQuery(".methods").length == 1 ){
		jQuery(".wc_payment_method").on("click", function(e){

			jQuery(".wc_payment_method").children(".payment_box").addClass( "plegar" );
			jQuery(this).children(".payment_box").removeClass( "plegar" );

			jQuery(".wc_payment_method").children(".plegar").slideUp( 250 );
			jQuery(this).children(".payment_box").slideDown( 250 );
		});
	}

});

// vlz_form_cupon 

function aplicarCupon(cupon){
	// 
	jQuery.post(
		"http://localhost/latrucha/carrito/?wc-ajax=apply_coupon",
		{
			coupon_code: cupon,
			security: wc_cart_params.apply_coupon_nonce
		},
		function(data){
			console.log(data);
			jQuery("#mensaje_cupon").html(data);
			setTimeout( function(){
				location.reload();
			}, 3000);
			// 
		}
	);
}

function removerCupon(cupon){
	// 
	jQuery.post(
		"http://localhost/latrucha/carrito/?wc-ajax=remove_coupon",
		{
			coupon: cupon,
			security: wc_cart_params.remove_coupon_nonce
		},
		function(data){
			console.log(data);
			jQuery("#mensaje_cupon").html(data);
			setTimeout( function(){
				location.reload();
			}, 3000);
			// 
		}
	);
}