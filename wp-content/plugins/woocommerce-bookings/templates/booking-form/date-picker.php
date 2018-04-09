<?php
	wp_enqueue_script( 'wc-bookings-date-picker' );
	extract( $field );

	$month_before_day = strpos( __( 'F j, Y' ), 'F' ) < strpos( __( 'F j, Y' ), 'j' );

	// Modificacion Angel Veloz
	
	wp_enqueue_style( 'jquery_datepick',get_template_directory_uri()."/lib/datapicker/jquery.datepick.css", array(), '1.0.0');

	wp_enqueue_script('jquery_plugin', get_template_directory_uri()."/lib/datapicker/jquery.plugin.js", array("jquery"), '1.0.0');
	wp_enqueue_script('jquery_datepick', get_template_directory_uri()."/lib/datapicker/jquery.datepick.js", array("jquery", "jquery_plugin"), '1.0.0');

?>

<!-- Modificacion Angel Veloz -->

<script type="text/javascript">
	var hoy = new Date();
	var fecha = new Date();
	fecha.setDate(fecha.getDate() + 1);
	var inicio = null;
	var fin = null;
	jQuery(document).ready(function() {
	
		function initCheckin(date, actual){
	        if(actual){
	            jQuery('#wc_bookings_field_date_salida').datepick({
	                dateFormat: 'dd/mm/yyyy',
	                defaultDate: date,
	                selectDefaultDate: true,
	                minDate: date,
	                onSelect: function(xdate) {
	                    accionCheckOut(xdate);
	                },
	                yearRange: date.getFullYear()+':'+(parseInt(date.getFullYear())+1),
	                firstDay: 1,
	                onmonthsToShow: [1, 1]
	            });
	        }else{
	            jQuery('#wc_bookings_field_date_salida').datepick({
	                dateFormat: 'dd/mm/yyyy',
	                minDate: date,
	                onSelect: function(xdate) {
	                    accionCheckOut(xdate);
	                },
	                yearRange: date.getFullYear()+':'+(parseInt(date.getFullYear())+1),
	                firstDay: 1,
	                onmonthsToShow: [1, 1]
	            });
	        }
	    }

	    jQuery('#wc_bookings_field_date_entrada').datepick({
	        dateFormat: 'dd/mm/yyyy',
	        minDate: fecha,
	        onSelect: function(date1) {
	            var ini = jQuery('#wc_bookings_field_date_entrada').datepick( "getDate" );
	            var fin = jQuery('#wc_bookings_field_date_salida').datepick( "getDate" );

	            accionCheckin(date1);

	            if( fin.length > 0 ){
	                var xini = ini[0].getTime();
	                var xfin = fin[0].getTime();
	                if( xini > xfin ){
	                    jQuery('#wc_bookings_field_date_salida').datepick('destroy');
	                    initCheckin(date1[0], true);
	                    accionCheckOut(date1);
	                }else{
	                    jQuery('#wc_bookings_field_date_salida').datepick('destroy');
	                    initCheckin(date1[0], false);
	                }
	            }else{
	                jQuery('#wc_bookings_field_date_salida').datepick('destroy');
	                initCheckin(date1[0], true);
	                accionCheckOut(date1);
	            }
	        },
	        yearRange: fecha.getFullYear()+':'+(parseInt(fecha.getFullYear())+1),
	        firstDay: 1,
	        onmonthsToShow: [1, 1]
	    });

	    jQuery('#wc_bookings_field_date_salida').datepick({
	        dateFormat: 'dd/mm/yyyy',
	        minDate: fecha,
	        onSelect: function(xdate) {
	            accionCheckOut(xdate);
	        },
	        yearRange: fecha.getFullYear()+':'+(parseInt(fecha.getFullYear())+1),
	        firstDay: 1,
	        onmonthsToShow: [1, 1]
	    });

	    function accionCheckin(xdate){
	    	jQuery(".booking_date_day").attr("value", xdate[0].getDate());
			jQuery(".booking_date_month").attr("value", xdate[0].getMonth()+1);
			jQuery(".booking_date_year").attr("value", xdate[0].getFullYear());
			jQuery(".booking_date_year").change();
			inicio = xdate[0];

			if( inicio != null && fin != null ){
				calcularDuracion(inicio.getTime(), fin.getTime());
			}
	    }

	    function accionCheckOut(xdate){
	    	jQuery(".booking_to_date_day").attr("value", xdate[0].getDate());
			jQuery(".booking_to_date_month").attr("value", xdate[0].getMonth()+1);
			jQuery(".booking_to_date_year").attr("value", xdate[0].getFullYear());
			jQuery(".booking_to_date_year").change();
			fin = xdate[0];
			if( inicio != null ){
				calcularDuracion(inicio.getTime(), xdate[0].getTime());
			}
	    }

	    function calcularDuracion(inicio, fin){
	    	var diff = fin - inicio;
			jQuery("#wc_bookings_field_duration").attr("value", diff/(1000*60*60*24) );
			jQuery('.wc-bookings-booking-form').change();
	    }

	});
</script>

<div class="form-field form-field-wide fechas">
	<div>
		<!-- <label for="wc_bookings_field_date_entrada">Entrada</label> -->
		<input type="text" id="wc_bookings_field_date_entrada" name="entrada" placeholder="Entrada" readonly />
	</div>
	<div>
		<!-- <label for="wc_bookings_field_date_salida">Salida</label> -->
		<input type="text" id="wc_bookings_field_date_salida" name="salida" placeholder="Salida" readonly />
	</div>
</div>

<!-- Fin Bloque Modificacion Angel Veloz -->


<fieldset class="wc-bookings-date-picker wc-bookings-date-picker-<?php echo esc_attr( $product_type ); ?> <?php echo implode( ' ', $class ); ?>" style="display: none; /* Modificacion Angel Veloz */">
	<legend>
		<span class="label"><?php echo $label; ?></span>: <small class="wc-bookings-date-picker-choose-date"><?php _e( 'Choose...', 'woocommerce-bookings' ); ?></small>
	</legend>

	<div class="picker" data-display="<?php echo $display; ?>" data-duration-unit="<?php echo esc_attr( $duration_unit );?>" data-availability="<?php echo esc_attr( json_encode( $availability_rules ) ); ?>" data-default-availability="<?php echo $default_availability ? 'true' : 'false'; ?>" data-fully-booked-days="<?php echo esc_attr( json_encode( $fully_booked_days ) ); ?>" data-partially-booked-days="<?php echo esc_attr( json_encode( $partially_booked_days ) ); ?>" data-buffer-days="<?php echo esc_attr( json_encode( $buffer_days ) ); ?>" data-min_date="<?php echo ! empty( $min_date_js ) ? $min_date_js : 0; ?>" data-max_date="<?php echo $max_date_js; ?>" data-default_date="<?php echo esc_attr( $default_date ); ?>" data-is_range_picker_enabled="<?php echo $is_range_picker_enabled ? 1 : 0; ?>"></div>

	<div class="wc-bookings-date-picker-date-fields">
		<?php if ( 'customer' == $duration_type && $is_range_picker_enabled ) : ?>
			<span><?php echo esc_html( apply_filters( 'woocommerce_bookings_date_picker_start_label', __( 'Start', 'woocommerce-bookings' ) ) ); ?>:</span><br />
		<?php endif; ?>

		<?php 
		// woocommerce_bookings_mdy_format filter to choose between month/day/year and day/month/year format
		if ( $month_before_day && apply_filters( 'woocommerce_bookings_mdy_format', true ) ) : ?>
		<label>
			<input type="text" name="<?php echo $name; ?>_month" placeholder="<?php _e( 'mm', 'woocommerce-bookings' ); ?>" size="2" class="booking_date_month" />
			<span><?php _e( 'Month', 'woocommerce-bookings' ); ?></span>
		</label> / <label>
			<input type="text" name="<?php echo $name; ?>_day" placeholder="<?php _e( 'dd', 'woocommerce-bookings' ); ?>" size="2" class="booking_date_day" />
			<span><?php _e( 'Day', 'woocommerce-bookings' ); ?></span>
		</label>
		<?php else : ?>
		<label>
			<input type="text" name="<?php echo $name; ?>_day" placeholder="<?php _e( 'dd', 'woocommerce-bookings' ); ?>" size="2" class="booking_date_day" />
			<span><?php _e( 'Day', 'woocommerce-bookings' ); ?></span>
		</label> / <label>
			<input type="text" name="<?php echo $name; ?>_month" placeholder="<?php _e( 'mm', 'woocommerce-bookings' ); ?>" size="2" class="booking_date_month" />
			<span><?php _e( 'Month', 'woocommerce-bookings' ); ?></span>
		</label>
		<?php endif; ?> / <label>
			<input type="text" value="<?php echo date( 'Y' ); ?>" name="<?php echo $name; ?>_year" placeholder="<?php _e( 'YYYY', 'woocommerce-bookings' ); ?>" size="4" class="booking_date_year" />
			<span><?php _e( 'Year', 'woocommerce-bookings' ); ?></span>
		</label>
	</div>

	<?php if ( 'customer' == $duration_type && $is_range_picker_enabled ) : ?>
		<div class="wc-bookings-date-picker-date-fields">
			<span><?php echo esc_html( apply_filters( 'woocommerce_bookings_date_picker_end_label', __( 'End', 'woocommerce-bookings' ) ) ); ?>:</span><br />
			<?php if ( $month_before_day ) : ?>
			<label>
				<input type="text" name="<?php echo $name; ?>_to_month" placeholder="<?php _e( 'mm', 'woocommerce-bookings' ); ?>" size="2" class="booking_to_date_month" />
				<span><?php _e( 'Month', 'woocommerce-bookings' ); ?></span>
			</label> / <label>
				<input type="text" name="<?php echo $name; ?>_to_day" placeholder="<?php _e( 'dd', 'woocommerce-bookings' ); ?>" size="2" class="booking_to_date_day" />
				<span><?php _e( 'Day', 'woocommerce-bookings' ); ?></span>
			</label>
			<?php else : ?>
			<label>
				<input type="text" name="<?php echo $name; ?>_to_day" placeholder="<?php _e( 'dd', 'woocommerce-bookings' ); ?>" size="2" class="booking_to_date_day" />
				<span><?php _e( 'Day', 'woocommerce-bookings' ); ?></span>
			</label> / <label>
				<input type="text" name="<?php echo $name; ?>_to_month" placeholder="<?php _e( 'mm', 'woocommerce-bookings' ); ?>" size="2" class="booking_to_date_month" />
				<span><?php _e( 'Month', 'woocommerce-bookings' ); ?></span>
			</label>
			<?php endif; ?> / <label>
				<input type="text" value="<?php echo date( 'Y' ); ?>" name="<?php echo $name; ?>_to_year" placeholder="<?php _e( 'YYYY', 'woocommerce-bookings' ); ?>" size="4" class="booking_to_date_year" />
				<span><?php _e( 'Year', 'woocommerce-bookings' ); ?></span>
			</label>
		</div>
	<?php endif; ?>
</fieldset>
