<!-- Modificado Angel Veloz -->
<?php 
	extract( $field ); 

	switch ( $name ) {
		case 'wc_bookings_field_persons': ?>
			<div class="cantidad_container <?php echo implode( ' ', $class ); ?>">
				<div class='cantidad_box'>
					<i class="fas fa-minus-circle"></i>
					<span id='cantidad_<?php echo $name; ?>' class='cantidad'>1</span>
					<i class="fas fa-plus-circle"></i>
					<input
						type="hidden"
						value="<?php echo ( ! empty( $min ) ) ? $min : 0; ?>"
						step="<?php echo ( isset( $step ) ) ? $step : ''; ?>"
						min="<?php echo ( isset( $min ) ) ? $min : ''; ?>"
						max="<?php echo ( isset( $max ) ) ? $max : ''; ?>"
						name="<?php echo $name; ?>"
						id="<?php echo $name; ?>"
					/>
				</div>
				<div class='label'>
					<?php echo $label; ?>
				</div>
				<!-- <div class='cantidad_max'>
					<?php echo "M&aacute;ximo: ".$max; ?>
				</div> -->
			</div>

			<script type="text/javascript">
				jQuery(document).ready(function() {
					jQuery(".fa-minus-circle").on("click", function(e){
						var min = jQuery("#<?php echo $name; ?>").attr("min");
						var max = jQuery("#<?php echo $name; ?>").attr("max");
						var val = jQuery("#<?php echo $name; ?>").val();
						if( val > min ){ val = parseInt(val)-1; }
						jQuery("#<?php echo $name; ?>").val( val );
						jQuery('#cantidad_<?php echo $name; ?>').html( val );
						jQuery("#<?php echo $name; ?>").change();
					});
					jQuery(".fa-plus-circle").on("click", function(e){
						var min = jQuery("#<?php echo $name; ?>").attr("min");
						var max = jQuery("#<?php echo $name; ?>").attr("max");
						var val = jQuery("#<?php echo $name; ?>").val();
						if( val < max ){ val = parseInt(val)+1; }
						jQuery("#<?php echo $name; ?>").val( val );
						jQuery('#cantidad_<?php echo $name; ?>').html( val );
						jQuery("#<?php echo $name; ?>").change();
					});
				});
			</script>
		<?php break;
		
		default: ?>
			 <p class="form-field form-field-wide <?php echo implode( ' ', $class ); ?>">
				<label for="<?php echo $name; ?>"><?php echo $label; ?>:</label>
				<input
					type="number"
					value="<?php echo ( ! empty( $min ) ) ? $min : 0; ?>"
					step="<?php echo ( isset( $step ) ) ? $step : ''; ?>"
					min="<?php echo ( isset( $min ) ) ? $min : ''; ?>"
					max="<?php echo ( isset( $max ) ) ? $max : ''; ?>"
					name="<?php echo $name; ?>"
					id="<?php echo $name; ?>"
					/> <?php echo ( ! empty( $after ) ) ? $after : ''; ?>
			</p> 
		<?php break;
	}
?>


