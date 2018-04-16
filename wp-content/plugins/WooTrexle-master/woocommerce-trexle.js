jQuery(document).ready(function($) {
jQuery('input#place_order').attr('disabled', 'disabled');
	jQuery('body.woocommerce-checkout').on('keyup','input[id^=trexle_payments-card]',function() {
        setButtonStatus();
	});
  	jQuery('body.woocommerce-checkout').on('updated_checkout',function() {
       	setButtonStatus();
  	});
  	jQuery('body.woocommerce-checkout').on('change','input[name=payment_method]',function() {
        setButtonStatus();      
  	});

  	function setButtonStatus() {
        if (areFieldsValid() || !jQuery('#payment_method_trexle_payments').is(':checked') || jQuery('input[name=trexle_customer_token]:checked').val() != "new") {
            jQuery('input#place_order').removeAttr('disabled');
        } else {
            jQuery('input#place_order').attr('disabled', 'disabled');
        }
  	}

  	function areFieldsValid() {
        var isValid = true;

        var number = jQuery('input#trexle_payments-card-number').val();
        number = number.replace(/[^0-9]/g, '');

        var validCardType = false;

        var re = new RegExp("^4[0-9]{12}(?:[0-9]{3})?$");
        if (number.match(re) != null) {
              validCardType = true;
        }
        re = new RegExp("^5[1-5][0-9]{14}$");
        if (number.match(re) != null) {
              validCardType = true;
        }
        re = new RegExp("^3[47][0-9]{13}$");
        if (number.match(re) != null) {
              validCardType = true;
        }
        re = new RegExp("^3(?:0[0-5]|[68][0-9])[0-9]{11}$");
        if (number.match(re) != null) {
              validCardType = true;
        }

        // Check the expiry
        var validExpiry = false;
        if (jQuery('input#trexle_payments-card-expiry').val().length == 7 || jQuery('input#trexle_payments-card-expiry').val().length == 9) {
              validExpiry = true;
        }

        // Check the CCV
        var validSecurityCode = false;
        if (jQuery('input#trexle_payments-card-cvc').val().length == 3 || jQuery('input#trexle_payments-card-cvc').val().length == 4) {
              validSecurityCode = true;
        }

        // Check the card name
        var validCardName = false;
        if (jQuery('input#trexle_payments-card-name').val().length > 2) {
              validCardName = true;
        }

        if (validCardType && validExpiry && validSecurityCode && validCardName) {
              return true;
        }
        return false;
    }

	// Below is from Trexle's JS version of Direct Post, taken from https://trexle.com
	// It has been modified for use with WooCommerce's ajax checkout process
	$(function() {

		Trexle.setPublicKey(WooTrexle.public_key);

		// Now we can call Trexle.js on form submission to retrieve a card token and submit
		// it to the server

		var $form = $('form#order_review, form.checkout'),
			$submitButton = $form.find(":submit"),
			$errors = $form.find('.errors');

		$('form.checkout').on('checkout_place_order_trexle_payments',function(e) {
			return checkoutFormSubmit(e);
		});

		$('form#order_review').submit(function(e) {
			return checkoutFormSubmit(e);
		});

		// Reset Trexle Card Token on change of details
		$("form.checkout, form#order_review").on('change', 'input#trexle_payments-card-cvc, select#trexle_payments-card-expiry, input#trexle_payments-card-number, input#trexle_payments-card-name', function( event ) {
			$('.woocommerce_error, .woocommerce-error, .woocommerce-message, .woocommerce_message').remove();
			$('input[name=card_token]').remove();
			$('input[name=ip_address]').remove();
		});

		// Show/hide for new CC box
		$("form.checkout, form#order_review").change('input[name=trexle_customer_token]', function() {
			if ($('input[name=trexle_customer_token]:checked').val() == 'new' ) {
				$('div.trexle_new_card.has_cards').slideDown( 200 );
			} else {
				$('div.trexle_new_card.has_cards').slideUp( 200 );
			}
			setButtonStatus();
		});

		function checkoutFormSubmit(e) {
			if ( jQuery('#payment_method_trexle_payments').is(':checked') && ( jQuery('input[name=trexle_customer_token]:checked').size() == 0 || jQuery('input[name=trexle_customer_token]:checked').val() == 'new' )) {
				if ( jQuery( 'input[name=card_token]' ).size() == 0 ) {
					e.preventDefault();
					$errors.hide();

					// Disable the submit button to prevent multiple clicks
					$submitButton.attr('disabled','disabled');

					// Fetch details required for the createToken call to Trexle

					var expiry = $('#trexle_payments-card-expiry').val();
					var expiry_month = '';
					var expiry_year = '';
					var expiry_parts = expiry.split(" / ");	
					if (expiry_parts.length > 1) {
						expiry_month = expiry_parts[0];
						expiry_year = expiry_parts[1];	
						if (expiry_year.length == 2) {
							expiry_year = "20"+expiry_year;
						}
					} 

					var card = {
						number: $('#trexle_payments-card-number').val(),
						name: $('#trexle_payments-card-name').val(),
						expiry_month: expiry_month,
						expiry_year: expiry_year,
						cvc: $('#trexle_payments-card-cvc').val(),
						address_line1: $('input#billing_address_1').val(),
						address_line2: $('input#billing_address_2').val(),
						address_city: $('input#billing_city').val(),
						address_state: $('select#billing_state,input#billing_state').val(),
						address_postcode: $('input#billing_postcode').val(),
						address_country: $('select#billing_country,input#billing_country').val()
					};

					$('.trexle_new_card').addClass('getting-token');

					// Request a token for the card from Trexle
					Trexle.createToken(card, handleTrexleResponse);
					return false;
				}
			}
			return true;
		};

		function handleTrexleResponse(response) {

			var $form = $('form#order_review, form.checkout');

			$('.trexle_new_card').removeClass('getting-token');
					
			if (response.response) {
				// Add the card token and ip address of the customer to the form
				// You will need to post these to Trexle when creating the charge.
				$('<input>')
					.attr({type: 'hidden', name: 'card_token'})
					.val(response.response.token)
					.appendTo($form);
				$('<input>')
					.attr({type: 'hidden', name: 'ip_address'})
					.val(response.ip_address)
					.appendTo($form);

				// Resubmit the form
				$form.submit();

			} else {

				// show the errors on the form
		        $('.woocommerce_error, .woocommerce-error, .woocommerce-message, .woocommerce_message, input[name=card_token], input[name=ip_address]').remove();
		        
				$('#trexle_payments-card-name').closest('p').before('<ul class="woocommerce_error woocommerce-error"></ul>');
				
				if (response.messages) {
					$.each(response.messages, function(index, errorMessage) {
						$('ul.woocommerce_error',$form).append($('<li>').text(errorMessage.message));
					});
				} else {
					$('ul.woocommerce_error',$form).append($('<li>').text('Sorry, we were unable to communicate with Trexle. Please check your API keys.'));
				}

				$submitButton.removeAttr('disabled');
				return false;
				
			}
		};
	});
});