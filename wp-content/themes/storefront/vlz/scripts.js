jQuery( document ).ready( function() {

	jQuery("#vlz_form_cupon").on("submit", function(e){
		aplicarCupon( jQuery(this).children(".form_cupon_input").val() );

		e.preventDefault();
	});

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