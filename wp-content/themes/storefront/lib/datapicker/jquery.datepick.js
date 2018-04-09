(function(){
	'use strict';
	var initializing = false;

	// The base JQClass implementation (does nothing)
	window.JQClass = function(){};

	// Collection of derived classes
	JQClass.classes = {};
 
	// Create a new JQClass that inherits from this class
	JQClass.extend = function extender(prop) {
		var base = this.prototype;

		// Instantiate a base class (but only create the instance, don't run the init constructor)
		initializing = true;
		var prototype = new this();
		initializing = false;

		// Copy the properties over onto the new prototype
		for (var name in prop) { // jshint loopfunc:true
			// Check if we're overwriting an existing function
			if (typeof prop[name] === 'function' && typeof base[name] === 'function') {
				prototype[name] = (function (name, fn) {
					return function () {
						var __super = this._super;
						// Add a new ._super() method that is the same method but on the super-class
						this._super = function (args) {
							return base[name].apply(this, args || []);
						};
						var ret = fn.apply(this, arguments);
						// The method only needs to be bound temporarily, so we remove it when we're done executing
						this._super = __super;
						return ret;
					};
				})(name, prop[name]);
			// Check if we're overwriting existing default options.
			} else if (typeof prop[name] === 'object' && typeof base[name] === 'object' && name === 'defaultOptions') {
				var obj1 = base[name];
				var obj2 = prop[name];
				var obj3 = {};
				var key;
				for (key in obj1) { // jshint forin:false
					obj3[key] = obj1[key];
				}
				for (key in obj2) { // jshint forin:false
					obj3[key] = obj2[key];
				}
				prototype[name] = obj3;
			} else {
				prototype[name] = prop[name];
			}
		}

		// The dummy class constructor
		function JQClass() {
			// All construction is actually done in the init method
			if (!initializing && this._init) {
				this._init.apply(this, arguments);
			}
		}

		// Populate our constructed prototype object
		JQClass.prototype = prototype;

		// Enforce the constructor to be what we expect
		JQClass.prototype.constructor = JQClass;

		// And make this class extendable
		JQClass.extend = extender;

		return JQClass;
	};
})();
/*! Abstract base class for collection plugins v1.0.2.
	Written by Keith Wood (wood.keith{at}optusnet.com.au) December 2013.
	Licensed under the MIT license (http://keith-wood.name/licence.html). */
(function($) { // Ensure $, encapsulate
	'use strict';

	JQClass.classes.JQPlugin = JQClass.extend({

		name: 'plugin',
		defaultOptions: {},
		regionalOptions: {},
		deepMerge: true,
		_getMarker: function() {
			return 'is-' + this.name;
		},
		_init: function() {
			$.extend(this.defaultOptions, (this.regionalOptions && this.regionalOptions['']) || {});
			var jqName = camelCase(this.name);
			$[jqName] = this;
			$.fn[jqName] = function(options) {
				var otherArgs = Array.prototype.slice.call(arguments, 1);
				var inst = this;
				var returnValue = this;
				this.each(function () {
					if (typeof options === 'string') {
						if (options[0] === '_' || !$[jqName][options]) {
							throw 'Unknown method: ' + options;
						}
						var methodValue = $[jqName][options].apply($[jqName], [this].concat(otherArgs));
						if (methodValue !== inst && methodValue !== undefined) {
							returnValue = methodValue;
							return false;
						}
					} else {
						$[jqName]._attach(this, options);
					}
				});
				return returnValue;
			};
		},
		setDefaults: function(options) {
			$.extend(this.defaultOptions, options || {});
		},
		_attach: function(elem, options) {
			elem = $(elem);
			if (elem.hasClass(this._getMarker())) {
				return;
			}
			elem.addClass(this._getMarker());
			options = $.extend(this.deepMerge, {}, this.defaultOptions, this._getMetadata(elem), options || {});
			var inst = $.extend({name: this.name, elem: elem, options: options}, this._instSettings(elem, options));
			elem.data(this.name, inst); // Save instance against element
			this._postAttach(elem, inst);
			this.option(elem, options);
		},
		_instSettings: function(elem, options) { // jshint unused:false
			return {};
		},
		_postAttach: function(elem, inst) { // jshint unused:false
		},
		_getMetadata: function(elem) {
			try {
				var data = elem.data(this.name.toLowerCase()) || '';
				data = data.replace(/(\\?)'/g, function(e, t) {
					return t ? '\'' : '"';
				}).replace(/([a-zA-Z0-9]+):/g, function(match, group, i) {
					var count = data.substring(0, i).match(/"/g); // Handle embedded ':'
					return (!count || count.length % 2 === 0 ? '"' + group + '":' : group + ':');
				}).replace(/\\:/g, ':');
				data = $.parseJSON('{' + data + '}');
				for (var key in data) {
					if (data.hasOwnProperty(key)) {
						var value = data[key];
						if (typeof value === 'string' && value.match(/^new Date\(([-0-9,\s]*)\)$/)) { // Convert dates
							data[key] = eval(value); // jshint ignore:line
						}
					}
				}
				return data;
			}
			catch (e) {
				return {};
			}
		},
		_getInst: function(elem) {
			return $(elem).data(this.name) || {};
		},
		option: function(elem, name, value) {
			elem = $(elem);
			var inst = elem.data(this.name);
			var options = name || {};
			if  (!name || (typeof name === 'string' && typeof value === 'undefined')) {
				options = (inst || {}).options;
				return (options && name ? options[name] : options);
			}
			if (!elem.hasClass(this._getMarker())) {
				return;
			}
			if (typeof name === 'string') {
				options = {};
				options[name] = value;
			}
			this._optionsChanged(elem, inst, options);
			$.extend(inst.options, options);
		},
		_optionsChanged: function(elem, inst, options) { // jshint unused:false
		},
		destroy: function(elem) {
			elem = $(elem);
			if (!elem.hasClass(this._getMarker())) {
				return;
			}
			this._preDestroy(elem, this._getInst(elem));
			elem.removeData(this.name).removeClass(this._getMarker());
		},
		_preDestroy: function(elem, inst) { // jshint unused:false
		}
	});

	function camelCase(name) {
		return name.replace(/-([a-z])/g, function(match, group) {
			return group.toUpperCase();
		});
	}

	$.JQPlugin = {
		createPlugin: function(superClass, overrides) {
			if (typeof superClass === 'object') {
				overrides = superClass;
				superClass = 'JQPlugin';
			}
			superClass = camelCase(superClass);
			var className = camelCase(overrides.name);
			JQClass.classes[className] = JQClass.classes[superClass].extend(overrides);
			new JQClass.classes[className](); // jshint ignore:line
		}
	};

})(jQuery);

(function($) {
	'use strict';
	var pluginName = 'datepick';
	$.JQPlugin.createPlugin({
		name: pluginName,
		defaultRenderer: {
			picker: '<div class="datepick">' +
			'<div class="datepick-nav"></div>{months}' +
			'{popup:start}<div class="datepick-ctrl"></div>{popup:end}' +
			'<div class="datepick-clear-fix"></div></div>',
			monthRow: '<div class="datepick-month-row">{months}</div>',
			month: '<div class="datepick-month"><div class="datepick-month-header">{link:prev}{monthHeader}{link:next}</div>' +
			'<table><thead>{weekHeader}</thead><tbody>{weeks}</tbody></table></div>',
			weekHeader: '<tr>{days}</tr>',
			dayHeader: '<th>{day}</th>',
			week: '<tr>{days}</tr>',
			day: '<td>{day}</td>',
			monthSelector: '.datepick-month',
			daySelector: 'td',
			rtlClass: 'datepick-rtl',
			multiClass: 'datepick-multi',
			defaultClass: '',
			selectedClass: 'datepick-selected',
			highlightedClass: 'datepick-highlight',
			todayClass: 'datepick-today',
			otherMonthClass: 'datepick-other-month',
			weekendClass: 'datepick-weekend',
			commandClass: 'datepick-cmd',
			commandButtonClass: '',
			commandLinkClass: '',
			disabledClass: 'datepick-disabled'
		},
		commands: {
			prev: {text: 'prevText', status: 'prevStatus', // Previous month
				keystroke: {keyCode: 33}, // Page up
				enabled: function(inst) {
					var minDate = inst.curMinDate();
					return (!minDate || plugin.add(plugin.day(
						plugin._applyMonthsOffset(plugin.add(plugin.newDate(inst.drawDate),
						1 - inst.options.monthsToStep, 'm'), inst), 1), -1, 'd').
						getTime() >= minDate.getTime());
				},
				date: function(inst) {
					return plugin.day(plugin._applyMonthsOffset(plugin.add(
						plugin.newDate(inst.drawDate), -inst.options.monthsToStep, 'm'), inst), 1);
				},
				action: function(inst) {
					plugin.changeMonth(this, -inst.options.monthsToStep);
				}
			},
			prevJump: {text: 'prevJumpText', status: 'prevJumpStatus', // Previous year
				keystroke: {keyCode: 33, ctrlKey: true}, // Ctrl + Page up
				enabled: function(inst) {
					var minDate = inst.curMinDate();
					return (!minDate || plugin.add(plugin.day(
						plugin._applyMonthsOffset(plugin.add(plugin.newDate(inst.drawDate),
						1 - inst.options.monthsToJump, 'm'), inst), 1), -1, 'd').
						getTime() >= minDate.getTime());
				},
				date: function(inst) {
					return plugin.day(plugin._applyMonthsOffset(plugin.add(
						plugin.newDate(inst.drawDate), -inst.options.monthsToJump, 'm'), inst), 1);
				},
				action: function(inst) {
					plugin.changeMonth(this, -inst.options.monthsToJump);
				}
			},
			next: {text: 'nextText', status: 'nextStatus', // Next month
				keystroke: {keyCode: 34}, // Page down
				enabled: function(inst) {
					var maxDate = inst.get('maxDate');
					return (!maxDate || plugin.day(plugin._applyMonthsOffset(plugin.add(
						plugin.newDate(inst.drawDate), inst.options.monthsToStep, 'm'), inst), 1).
						getTime() <= maxDate.getTime());
				},
				date: function(inst) {
					return plugin.day(plugin._applyMonthsOffset(plugin.add(
						plugin.newDate(inst.drawDate), inst.options.monthsToStep, 'm'), inst), 1);
				},
				action: function(inst) {
					plugin.changeMonth(this, inst.options.monthsToStep);
				}
			},
			nextJump: {text: 'nextJumpText', status: 'nextJumpStatus', // Next year
				keystroke: {keyCode: 34, ctrlKey: true}, // Ctrl + Page down
				enabled: function(inst) {
					var maxDate = inst.get('maxDate');
					return (!maxDate || plugin.day(plugin._applyMonthsOffset(plugin.add(
						plugin.newDate(inst.drawDate), inst.options.monthsToJump, 'm'), inst), 1).
						getTime() <= maxDate.getTime());
				},
				date: function(inst) {
					return plugin.day(plugin._applyMonthsOffset(plugin.add(
						plugin.newDate(inst.drawDate), inst.options.monthsToJump, 'm'), inst), 1);
				},
				action: function(inst) {
					plugin.changeMonth(this, inst.options.monthsToJump);
				}
			},
			current: {text: 'currentText', status: 'currentStatus', // Current month
				keystroke: {keyCode: 36, ctrlKey: true}, // Ctrl + Home
				enabled: function(inst) {
					var minDate = inst.curMinDate();
					var maxDate = inst.get('maxDate');
					var curDate = inst.selectedDates[0] || plugin.today();
					return (!minDate || curDate.getTime() >= minDate.getTime()) &&
						(!maxDate || curDate.getTime() <= maxDate.getTime());
				},
				date: function(inst) {
					return inst.selectedDates[0] || plugin.today();
				},
				action: function(inst) {
					var curDate = inst.selectedDates[0] || plugin.today();
					plugin.showMonth(this, curDate.getFullYear(), curDate.getMonth() + 1);
				}
			},
			today: {text: 'todayText', status: 'todayStatus', // Today's month
				keystroke: {keyCode: 36, ctrlKey: true}, // Ctrl + Home
				enabled: function(inst) {
					var minDate = inst.curMinDate();
					var maxDate = inst.get('maxDate');
					return (!minDate || plugin.today().getTime() >= minDate.getTime()) &&
						(!maxDate || plugin.today().getTime() <= maxDate.getTime());
				},
				date: function() { return plugin.today(); },
				action: function() { plugin.showMonth(this); }
			},
			clear: {text: 'clearText', status: 'clearStatus', // Clear the datepicker
				keystroke: {keyCode: 35, ctrlKey: true}, // Ctrl + End
				enabled: function() { return true; },
				date: function() { return null; },
				action: function() { plugin.clear(this); }
			},
			close: {text: 'closeText', status: 'closeStatus', // Close the datepicker
				keystroke: {keyCode: 27}, // Escape
				enabled: function() { return true; },
				date: function() { return null; },
				action: function() { plugin.hide(this); }
			},
			prevWeek: {text: 'prevWeekText', status: 'prevWeekStatus', // Previous week
				keystroke: {keyCode: 38, ctrlKey: true}, // Ctrl + Up
				enabled: function(inst) {
					var minDate = inst.curMinDate();
					return (!minDate || plugin.add(plugin.newDate(inst.drawDate), -7, 'd').
						getTime() >= minDate.getTime());
				},
				date: function(inst) { return plugin.add(plugin.newDate(inst.drawDate), -7, 'd'); },
				action: function() { plugin.changeDay(this, -7); }
			},
			prevDay: {text: 'prevDayText', status: 'prevDayStatus', // Previous day
				keystroke: {keyCode: 37, ctrlKey: true}, // Ctrl + Left
				enabled: function(inst) {
					var minDate = inst.curMinDate();
					return (!minDate || plugin.add(plugin.newDate(inst.drawDate), -1, 'd').
						getTime() >= minDate.getTime());
				},
				date: function(inst) { return plugin.add(plugin.newDate(inst.drawDate), -1, 'd'); },
				action: function() { plugin.changeDay(this, -1); }
			},
			nextDay: {text: 'nextDayText', status: 'nextDayStatus', // Next day
				keystroke: {keyCode: 39, ctrlKey: true}, // Ctrl + Right
				enabled: function(inst) {
					var maxDate = inst.get('maxDate');
					return (!maxDate || plugin.add(plugin.newDate(inst.drawDate), 1, 'd').
						getTime() <= maxDate.getTime());
				},
				date: function(inst) { return plugin.add(plugin.newDate(inst.drawDate), 1, 'd'); },
				action: function() { plugin.changeDay(this, 1); }
			},
			nextWeek: {text: 'nextWeekText', status: 'nextWeekStatus', // Next week
				keystroke: {keyCode: 40, ctrlKey: true}, // Ctrl + Down
				enabled: function(inst) {
					var maxDate = inst.get('maxDate');
					return (!maxDate || plugin.add(plugin.newDate(inst.drawDate), 7, 'd').
						getTime() <= maxDate.getTime());
				},
				date: function(inst) { return plugin.add(plugin.newDate(inst.drawDate), 7, 'd'); },
				action: function() { plugin.changeDay(this, 7); }
			}
		},
		defaultOptions: {
			pickerClass: '',
			showOnFocus: true,
			showTrigger: null,
			showAnim: '',
			showOptions: {},
			showSpeed: 'normal',
			popupContainer: null,
			alignment: 'bottom',
			fixedWeeks: false,
			firstDay: 1,
			calculateWeek: null, // this.iso8601Week,
			monthsToShow: 1,
			monthsOffset: 0,
			monthsToStep: 1,
			monthsToJump: 12,
			useMouseWheel: true,
			changeMonth: true,
			yearRange: 'c-10:c+10',
			shortYearCutoff: '+10',
			showOtherMonths: false,
			selectOtherMonths: false,
			defaultDate: null,
			selectDefaultDate: false,
			minDate: null,
			maxDate: null,
			dateFormat: 'dd/mm/yyyy',
			autoSize: false,
			rangeSelect: false,
			rangeSeparator: ' - ',
			multiSelect: 0,
			multiSeparator: ',',
			onDate: null,
			onShow: null,
			onChangeMonthYear: null,
			onSelect: null,
			onClose: null,
			altField: null,
			altFormat: null,
			constrainInput: true,
			commandsAsDateFormat: false,
			commands: {} // this.commands
		},

		regionalOptions: {
			'': {
				monthNames: ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'],
				monthNamesShort: ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'],
				dayNames: ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'],
				dayNamesShort: ['Dom','Lun','Mar','Mié','Juv','Vie','Sáb'],
				dayNamesMin: ['Do','Lu','Ma','Mi','Ju','Vi','Sá'],
				dateFormat: 'dd/mm/yyyy',
				firstDay: 0,
				renderer: {}, // this.defaultRenderer
				prevText: '',
				prevStatus: 'Mostrar el mes anterior',
				prevJumpText: '&lt;&lt;',
				prevJumpStatus: 'Mostrar el a&ntilde;o anterior',
				nextText: '',
				nextStatus: 'Mostrar el siguiente mes',
				nextJumpText: '&gt;&gt;',
				nextJumpStatus: 'Mostrar el siguiente a&ntilde;o',
				currentText: 'Current',
				currentStatus: 'Mostrar el mes actual',
				todayText: 'Hoy',
				todayStatus: 'D&iacute;a del mes',
				clearText: 'Limpiar',
				clearStatus: 'Limpiar todas las fechas',
				closeText: 'Cerrar',
				closeStatus: 'Cerrar',
				yearStatus: 'Cambiar a&ntilde;o',
				earlierText: '&#160;&#160;▲',
				laterText: '&#160;&#160;▼',
				monthStatus: 'Cambiar el mes',
				weekText: 'Wk',
				weekStatus: 'Semana del a&ntilde;o',
				dayStatus: 'DD, M d, yyyy',
				defaultStatus: 'Seleccionar fecha',
				isRTL: false
			}
		},

		_disabled: [],

		_popupClass: pluginName + '-popup', // Marker for popup division
		_triggerClass: pluginName + '-trigger', // Marker for trigger element
		_disableClass: pluginName + '-disable', // Marker for disabled element
		_monthYearClass: pluginName + '-month-year', // Marker for month/year inputs
		_curMonthClass: pluginName + '-month-', // Marker for current month/year
		_anyYearClass: pluginName + '-any-year', // Marker for year direct input
		_curDoWClass: pluginName + '-dow-', // Marker for day of week

		_ticksTo1970: (((1970 - 1) * 365 + Math.floor(1970 / 4) - Math.floor(1970 / 100) +
			Math.floor(1970 / 400)) * 24 * 60 * 60 * 10000000),
		_msPerDay: 24 * 60 * 60 * 1000,

		/** The {@linkcode module:Datepick~formatDate|date format} for use with Atom (RFC 3339/ISO 8601): yyyy-mm-dd. */
		ATOM: 'yyyy-mm-dd',
		/** The {@linkcode module:Datepick~formatDate|date format} for use with cookies: D, dd M yyyy. */
		COOKIE: 'D, dd M yyyy',
		/** The {@linkcode module:Datepick~formatDate|date format} for full display: DD, MM d, yyyy. */
		FULL: 'DD, MM d, yyyy',
		/** The {@linkcode module:Datepick~formatDate|date format} for use with ISO 8601: yyyy-mm-dd. */
		ISO_8601: 'yyyy-mm-dd',
		/** The {@linkcode module:Datepick~formatDate|date format} for Julian dates: J. */
		JULIAN: 'J',
		/** The {@linkcode module:Datepick~formatDate|date format} for use with RFC 822: D, d M yy. */
		RFC_822: 'D, d M yy',
		/** The {@linkcode module:Datepick~formatDate|date format} for use with RFC 850: DD, dd-M-yy. */
		RFC_850: 'DD, dd-M-yy',
		/** The {@linkcode module:Datepick~formatDate|date format} for use with RFC 1036: D, d M yy. */
		RFC_1036: 'D, d M yy',
		/** The {@linkcode module:Datepick~formatDate|date format} for use with RFC 1123: D, d M yyyy. */
		RFC_1123: 'D, d M yyyy',
		/** The {@linkcode module:Datepick~formatDate|date format} for use with RFC 2822: D, d M yyyy. */
		RFC_2822: 'D, d M yyyy',
		/** The {@linkcode module:Datepick~formatDate|date format} for use with RSS (RFC 822): D, d M yy. */
		RSS: 'D, d M yy',
		/** The {@linkcode module:Datepick~formatDate|date format} for Windows ticks: !. */
		TICKS: '!',
		/** The {@linkcode module:Datepick~formatDate|date format} for Unix timestamp: @. */
		TIMESTAMP: '@',
		/** The {@linkcode module:Datepick~formatDate|date format} for use with W3C (ISO 8601): yyyy-mm-dd. */
		W3C: 'yyyy-mm-dd',

		formatDate: function(format, date, settings) {
			if (typeof format !== 'string') {
				settings = date;
				date = format;
				format = '';
			}
			if (!date) {
				return '';
			}
			format = format || this.defaultOptions.dateFormat;
			settings = settings || {};
			var dayNamesShort = settings.dayNamesShort || this.defaultOptions.dayNamesShort;
			var dayNames = settings.dayNames || this.defaultOptions.dayNames;
			var monthNamesShort = settings.monthNamesShort || this.defaultOptions.monthNamesShort;
			var monthNames = settings.monthNames || this.defaultOptions.monthNames;
			var calculateWeek = settings.calculateWeek || this.defaultOptions.calculateWeek;
			// Check whether a format character is doubled
			var doubled = function(match, step) {
				var matches = 1;
				while (iFormat + matches < format.length && format.charAt(iFormat + matches) === match) {
					matches++;
				}
				iFormat += matches - 1;
				return Math.floor(matches / (step || 1)) > 1;
			};
			// Format a number, with leading zeroes if necessary
			var formatNumber = function(match, value, len, step) {
				var num = '' + value;
				if (doubled(match, step)) {
					while (num.length < len) {
						num = '0' + num;
					}
				}
				return num;
			};
			// Format a name, short or long as requested
			var formatName = function(match, value, shortNames, longNames) {
				return (doubled(match) ? longNames[value] : shortNames[value]);
			};
			var output = '';
			var literal = false;
			for (var iFormat = 0; iFormat < format.length; iFormat++) {
				if (literal) {
					if (format.charAt(iFormat) === '\'' && !doubled('\'')) {
						literal = false;
					}
					else {
						output += format.charAt(iFormat);
					}
				}
				else {
					switch (format.charAt(iFormat)) {
						case 'd':
							output += formatNumber('d', date.getDate(), 2);
							break;
						case 'D':
							output += formatName('D', date.getDay(), dayNamesShort, dayNames);
							break;
						case 'o':
							output += formatNumber('o', this.dayOfYear(date), 3);
							break;
						case 'w':
							output += formatNumber('w', calculateWeek(date), 2);
							break;
						case 'm':
							output += formatNumber('m', date.getMonth() + 1, 2);
							break;
						case 'M':
							output += formatName('M', date.getMonth(), monthNamesShort, monthNames);
							break;
						case 'y':
							output += (doubled('y', 2) ? date.getFullYear() :
								(date.getFullYear() % 100 < 10 ? '0' : '') + date.getFullYear() % 100);
							break;
						case '@':
							output += Math.floor(date.getTime() / 1000);
							break;
						case '!':
							output += date.getTime() * 10000 + this._ticksTo1970;
							break;
						case '\'':
							if (doubled('\'')) {
								output += '\'';
							}
							else {
								literal = true;
							}
							break;
						default:
							output += format.charAt(iFormat);
					}
				}
			}
			return output;
		},

		parseDate: function(format, value, settings) {
			if (typeof value === 'undefined' || value === null) {
				throw 'Invalid arguments';
			}
			value = (typeof value === 'object' ? value.toString() : value + '');
			if (value === '') {
				return null;
			}
			format = format || this.defaultOptions.dateFormat;
			settings = settings || {};
			var shortYearCutoff = settings.shortYearCutoff || this.defaultOptions.shortYearCutoff;
			shortYearCutoff = (typeof shortYearCutoff !== 'string' ? shortYearCutoff :
				this.today().getFullYear() % 100 + parseInt(shortYearCutoff, 10));
			var dayNamesShort = settings.dayNamesShort || this.defaultOptions.dayNamesShort;
			var dayNames = settings.dayNames || this.defaultOptions.dayNames;
			var monthNamesShort = settings.monthNamesShort || this.defaultOptions.monthNamesShort;
			var monthNames = settings.monthNames || this.defaultOptions.monthNames;
			var year = -1;
			var month = -1;
			var day = -1;
			var doy = -1;
			var shortYear = false;
			var literal = false;
			var date = null;
			// Check whether a format character is doubled
			var doubled = function(match, step) {
				var matches = 1;
				while (iFormat + matches < format.length && format.charAt(iFormat + matches) === match) {
					matches++;
				}
				iFormat += matches - 1;
				return Math.floor(matches / (step || 1)) > 1;
			};
			// Extract a number from the string value
			var getNumber = function(match, step) {
				var isDoubled = doubled(match, step);
				var size = [2, 3, isDoubled ? 4 : 2, 11, 20]['oy@!'.indexOf(match) + 1];
				var digits = new RegExp('^-?\\d{1,' + size + '}');
				var num = value.substring(iValue).match(digits);
				if (!num) {
					throw 'Missing number at position {0}'.replace(/\{0\}/, iValue);
				}
				iValue += num[0].length;
				return parseInt(num[0], 10);
			};
			// Extract a name from the string value and convert to an index
			var getName = function(match, shortNames, longNames, step) {
				var names = (doubled(match, step) ? longNames : shortNames);
				for (var i = 0; i < names.length; i++) {
					if (value.substr(iValue, names[i].length).toLowerCase() === names[i].toLowerCase()) {
						iValue += names[i].length;
						return i + 1;
					}
				}
				throw 'Unknown name at position {0}'.replace(/\{0\}/, iValue);
			};
			// Confirm that a literal character matches the string value
			var checkLiteral = function() {
				if (value.charAt(iValue) !== format.charAt(iFormat)) {
					throw 'Unexpected literal at position {0}'.replace(/\{0\}/, iValue);
				}
				iValue++;
			};
			var iValue = 0;
			for (var iFormat = 0; iFormat < format.length; iFormat++) {
				if (literal) {
					if (format.charAt(iFormat) === '\'' && !doubled('\'')) {
						literal = false;
					}
					else {
						checkLiteral();
					}
				}
				else {
					switch (format.charAt(iFormat)) {
						case 'd':
							day = getNumber('d');
							break;
						case 'D':
							getName('D', dayNamesShort, dayNames);
							break;
						case 'o':
							doy = getNumber('o');
							break;
						case 'w':
							getNumber('w');
							break;
						case 'm':
							month = getNumber('m');
							break;
						case 'M':
							month = getName('M', monthNamesShort, monthNames);
							break;
						case 'y':
							var iSave = iFormat;
							shortYear = !doubled('y', 2);
							iFormat = iSave;
							year = getNumber('y', 2);
							break;
						case '@':
							date = this._normaliseDate(new Date(getNumber('@') * 1000));
							year = date.getFullYear();
							month = date.getMonth() + 1;
							day = date.getDate();
							break;
						case '!':
							date = this._normaliseDate(
								new Date((getNumber('!') - this._ticksTo1970) / 10000));
							year = date.getFullYear();
							month = date.getMonth() + 1;
							day = date.getDate();
							break;
						case '*':
							iValue = value.length;
							break;
						case '\'':
							if (doubled('\'')) {
								checkLiteral();
							}
							else {
								literal = true;
							}
							break;
						default:
							checkLiteral();
					}
				}
			}
			if (iValue < value.length) {
				throw 'Additional text found at end';
			}
			if (year === -1) {
				year = this.today().getFullYear();
			}
			else if (year < 100 && shortYear) {
				year += (shortYearCutoff === -1 ? 1900 : this.today().getFullYear() -
					this.today().getFullYear() % 100 - (year <= shortYearCutoff ? 0 : 100));
			}
			if (doy > -1) {
				month = 1;
				day = doy;
				for (var dim = this.daysInMonth(year, month); day > dim;
						dim = this.daysInMonth(year, month)) {
					month++;
					day -= dim;
				}
			}
			date = this.newDate(year, month, day);
			if (date.getFullYear() !== year || date.getMonth() + 1 !== month || date.getDate() !== day) {
				throw 'Invalid date';
			}
			return date;
		},

		determineDate: function(dateSpec, defaultDate, currentDate, dateFormat, settings) {
			if (currentDate && typeof currentDate !== 'object') {
				settings = dateFormat;
				dateFormat = currentDate;
				currentDate = null;
			}
			if (typeof dateFormat !== 'string') {
				settings = dateFormat;
				dateFormat = '';
			}
			var offsetString = function(offset) {
				try {
					return plugin.parseDate(dateFormat, offset, settings);
				}
				catch (e) {
					// Ignore
				}
				offset = offset.toLowerCase();
				var date = (offset.match(/^c/) && currentDate ? plugin.newDate(currentDate) : null) ||
					plugin.today();
				var pattern = /([+-]?[0-9]+)\s*(d|w|m|y)?/g;
				var matches = null;
				while ((matches = pattern.exec(offset))) {
					date = plugin.add(date, parseInt(matches[1], 10), matches[2] || 'd');
				}
				return date;
			};
			defaultDate = (defaultDate ? plugin.newDate(defaultDate) : null);
			dateSpec = (typeof dateSpec === 'undefined' ? defaultDate :
				(typeof dateSpec === 'string' ? offsetString(dateSpec) : (typeof dateSpec === 'number' ?
				(isNaN(dateSpec) || dateSpec === Infinity || dateSpec === -Infinity ? defaultDate :
				plugin.add(plugin.today(), dateSpec, 'd')) : plugin.newDate(dateSpec))));
			return dateSpec;
		},

		daysInMonth: function(year, month) {
			month = (year.getFullYear ? year.getMonth() + 1 : month);
			year = (year.getFullYear ? year.getFullYear() : year);
			return this.newDate(year, month + 1, 0).getDate();
		},

		dayOfYear: function(year, month, day) {
			var date = (year.getFullYear ? year : plugin.newDate(year, month, day));
			var newYear = plugin.newDate(date.getFullYear(), 1, 1);
			return Math.floor((date.getTime() - newYear.getTime()) / plugin._msPerDay) + 1;
		},

		iso8601Week: function(year, month, day) {
			var checkDate = (year.getFullYear ?
				new Date(year.getTime()) : plugin.newDate(year, month, day));
			// Find Thursday of this week starting on Monday
			checkDate.setDate(checkDate.getDate() + 4 - (checkDate.getDay() || 7));
			var time = checkDate.getTime();
			checkDate.setMonth(0, 1); // Compare with Jan 1
			return Math.floor(Math.round((time - checkDate) / plugin._msPerDay) / 7) + 1;
		},

		today: function() {
			return this._normaliseDate(new Date());
		},

		newDate: function(year, month, day) {
			return (!year ? null : (year.getFullYear ? this._normaliseDate(new Date(year.getTime())) :
				new Date(year, month - 1, day, 12)));
		},

		_normaliseDate: function(date) {
			if (date) {
				date.setHours(12, 0, 0, 0);
			}
			return date;
		},

		year: function(date, year) {
			date.setFullYear(year);
			return this._normaliseDate(date);
		},

		month: function(date, month) {
			date.setMonth(month - 1);
			return this._normaliseDate(date);
		},

		day: function(date, day) {
			date.setDate(day);
			return this._normaliseDate(date);
		},

		add: function(date, amount, period) {
			if (period === 'd' || period === 'w') {
				this._normaliseDate(date);
				date.setDate(date.getDate() + amount * (period === 'w' ? 7 : 1));
			}
			else {
				var year = date.getFullYear() + (period === 'y' ? amount : 0);
				var month = date.getMonth() + (period === 'm' ? amount : 0);
				date.setTime(plugin.newDate(year, month + 1,
					Math.min(date.getDate(), this.daysInMonth(year, month + 1))).getTime());
			}
			return date;
		},

		_applyMonthsOffset: function(date, inst) {
			var monthsOffset = inst.options.monthsOffset;
			if ($.isFunction(monthsOffset)) {
				monthsOffset = monthsOffset.apply(inst.elem[0], [date]);
			}
			return plugin.add(date, -monthsOffset, 'm');
		},

		_init: function() {
			this.defaultOptions.commands = this.commands;
			this.defaultOptions.calculateWeek = this.iso8601Week;
			this.regionalOptions[''].renderer = this.defaultRenderer;
			this._super();
		},

		_instSettings: function(elem) {
			return {selectedDates: [], drawDate: null, pickingRange: false,
				inline: ($.inArray(elem[0].nodeName.toLowerCase(), ['div', 'span']) > -1),
				get: function(name) { // Get a setting value, computing if necessary
					if ($.inArray(name, ['defaultDate', 'minDate', 'maxDate']) > -1) { // Decode date settings
						return plugin.determineDate(this.options[name], null,
							this.selectedDates[0], this.options.dateFormat, this.getConfig());
					}
					return this.options[name];
				},
				curMinDate: function() {
					return (this.pickingRange ? this.selectedDates[0] : this.get('minDate'));
				},
				getConfig: function() {
					return {dayNamesShort: this.options.dayNamesShort, dayNames: this.options.dayNames,
						monthNamesShort: this.options.monthNamesShort, monthNames: this.options.monthNames,
						calculateWeek: this.options.calculateWeek,
						shortYearCutoff: this.options.shortYearCutoff};
				}
			};
		},

		_postAttach: function(elem, inst) {
			if (inst.inline) {
				inst.drawDate = plugin._checkMinMax(plugin.newDate(inst.selectedDates[0] ||
					inst.get('defaultDate') || plugin.today()), inst);
				inst.prevDate = plugin.newDate(inst.drawDate);
				this._update(elem[0]);
				if ($.fn.mousewheel) {
					elem.mousewheel(this._doMouseWheel);
				}
			}
			else {
				this._attachments(elem, inst);
				elem.on('keydown.' + inst.name, this._keyDown).on('keypress.' + inst.name, this._keyPress).
					on('keyup.' + inst.name, this._keyUp);
				if (elem.attr('disabled')) {
					this.disable(elem[0]);
				}
			}
		},

		_optionsChanged: function(elem, inst, options) {
			if (options.calendar && options.calendar !== inst.options.calendar) {
				var discardDate = function(name) {
					return (typeof inst.options[name] === 'object' ? null : inst.options[name]);
				};
				options = $.extend({defaultDate: discardDate('defaultDate'),
					minDate: discardDate('minDate'), maxDate: discardDate('maxDate')}, options);
				inst.selectedDates = [];
				inst.drawDate = null;
			}
			var dates = inst.selectedDates;
			$.extend(inst.options, options);
			this.setDate(elem[0], dates, null, false, true);
			inst.pickingRange = false;
			inst.drawDate = plugin.newDate(this._checkMinMax(
				(inst.options.defaultDate ? inst.get('defaultDate') : inst.drawDate) ||
				inst.get('defaultDate') || plugin.today(), inst));
			if (!inst.inline) {
				this._attachments(elem, inst);
			}
			if (inst.inline || inst.div) {
				this._update(elem[0]);
			}
		},

		_attachments: function(elem, inst) {
			elem.off('focus.' + inst.name);
			if (inst.options.showOnFocus) {
				elem.on('focus.' + inst.name, this.show);
			}
			if (inst.trigger) {
				inst.trigger.remove();
			}
			var trigger = inst.options.showTrigger;
			inst.trigger = (!trigger ? $([]) :
				$(trigger).clone().removeAttr('id').addClass(this._triggerClass)
					[inst.options.isRTL ? 'insertBefore' : 'insertAfter'](elem).
					click(function() {
						if (!plugin.isDisabled(elem[0])) {
							plugin[plugin.curInst === inst ? 'hide' : 'show'](elem[0]);
						}
					}));
			this._autoSize(elem, inst);
			var dates = this._extractDates(inst, elem.val());
			if (dates) {
				this.setDate(elem[0], dates, null, true);
			}
			var defaultDate = inst.get('defaultDate');
			if (inst.options.selectDefaultDate && defaultDate && inst.selectedDates.length === 0) {
				this.setDate(elem[0], plugin.newDate(defaultDate || plugin.today()));
			}
		},

		_autoSize: function(elem, inst) {
			if (inst.options.autoSize && !inst.inline) {
				var date = plugin.newDate(2009, 10, 20); // Ensure double digits
				var dateFormat = inst.options.dateFormat;
				if (dateFormat.match(/[DM]/)) {
					var findMax = function(names) {
						var max = 0;
						var maxI = 0;
						for (var i = 0; i < names.length; i++) {
							if (names[i].length > max) {
								max = names[i].length;
								maxI = i;
							}
						}
						return maxI;
					};
					date.setMonth(findMax(inst.options[dateFormat.match(/MM/) ? // Longest month
						'monthNames' : 'monthNamesShort']));
					date.setDate(findMax(inst.options[dateFormat.match(/DD/) ? // Longest day
						'dayNames' : 'dayNamesShort']) + 20 - date.getDay());
				}
				inst.elem.attr('size', plugin.formatDate(dateFormat, date, inst.getConfig()).length);
			}
		},

		_preDestroy: function(elem, inst) {
			if (inst.trigger) {
				inst.trigger.remove();
			}
			elem.empty().off('.' + inst.name);
			if (inst.inline && $.fn.mousewheel) {
				elem.unmousewheel();
			}
			if (!inst.inline && inst.options.autoSize) {
				elem.removeAttr('size');
			}
		},

		multipleEvents: function() {
			var funcs = arguments;
			return function() {
				for (var i = 0; i < funcs.length; i++) {
					funcs[i].apply(this, arguments);
				}
			};
		},

		enable: function(elem) {
			elem = $(elem);
			if (!elem.hasClass(this._getMarker())) {
				return;
			}
			var inst = this._getInst(elem);
			if (inst.inline) {
				elem.children('.' + this._disableClass).remove().end().
					find('button,select').prop('disabled', false).end().
					find('a').attr('href', '#');
			}
			else {
				elem.prop('disabled', false);
				inst.trigger.filter('button.' + this._triggerClass).prop('disabled', false).end().
					filter('img.' + this._triggerClass).css({opacity: '1.0', cursor: ''});
			}
			this._disabled = $.map(this._disabled,
				function(value) { return (value === elem[0] ? null : value); }); // Delete entry
		},

		disable: function(elem) {
			elem = $(elem);
			if (!elem.hasClass(this._getMarker())) {
				return;
			}
			var inst = this._getInst(elem);
			if (inst.inline) {
				var inline = elem.children(':last');
				var offset = inline.offset();
				var relOffset = {left: 0, top: 0};
				inline.parents().each(function() {
					if ($(this).css('position') === 'relative') {
						relOffset = $(this).offset();
						return false;
					}
				});
				var zIndex = elem.css('zIndex');
				zIndex = (zIndex === 'auto' ? 0 : parseInt(zIndex, 10)) + 1;
				elem.prepend('<div class="' + this._disableClass + '" style="' +
					'width: ' + inline.outerWidth() + 'px; height: ' + inline.outerHeight() +
					'px; left: ' + (offset.left - relOffset.left) + 'px; top: ' +
					(offset.top - relOffset.top) + 'px; z-index: ' + zIndex + '"></div>').
					find('button,select').prop('disabled', true).end().
					find('a').removeAttr('href');
			}
			else {
				elem.prop('disabled', true);
				inst.trigger.filter('button.' + this._triggerClass).prop('disabled', true).end().
					filter('img.' + this._triggerClass).css({opacity: '0.5', cursor: 'default'});
			}
			this._disabled = $.map(this._disabled,
				function(value) { return (value === elem[0] ? null : value); }); // Delete entry
			this._disabled.push(elem[0]);
		},

		isDisabled: function(elem) {
			return (elem && $.inArray(elem, this._disabled) > -1);
		},

		show: function(elem) {
			elem = $(elem.target || elem);
			var inst = plugin._getInst(elem);
			if (plugin.curInst === inst) {
				return;
			}
			if (plugin.curInst) {
				plugin.hide(plugin.curInst, true);
			}
			if (!$.isEmptyObject(inst)) {
				// Retrieve existing date(s)
				inst.lastVal = null;
				inst.selectedDates = plugin._extractDates(inst, elem.val());
				inst.pickingRange = false;
				inst.drawDate = plugin._checkMinMax(plugin.newDate(inst.selectedDates[0] ||
					inst.get('defaultDate') || plugin.today()), inst);
				inst.prevDate = plugin.newDate(inst.drawDate);
				plugin.curInst = inst;
				// Generate content
				plugin._update(elem[0], true);
				// Adjust position before showing
				var offset = plugin._checkOffset(inst);
				inst.div.css({left: offset.left, top: offset.top});
				// And display
				var showAnim = inst.options.showAnim;
				var showSpeed = inst.options.showSpeed;
				showSpeed = (showSpeed === 'normal' && $.ui &&
					parseInt($.ui.version.substring(2)) >= 8 ? '_default' : showSpeed);
				if ($.effects && ($.effects[showAnim] || ($.effects.effect && $.effects.effect[showAnim]))) {
					var data = inst.div.data(); // Update old effects data
					for (var key in data) {
						if (key.match(/^ec\.storage\./)) {
							data[key] = inst._mainDiv.css(key.replace(/ec\.storage\./, ''));
						}
					}
					inst.div.data(data).show(showAnim, inst.options.showOptions, showSpeed);
				}
				else {
					inst.div[showAnim || 'show'](showAnim ? showSpeed : 0);
				}
			}
		},

		_extractDates: function(inst, datesText) {
			if (datesText === inst.lastVal) {
				return;
			}
			inst.lastVal = datesText;
			datesText = datesText.split(inst.options.multiSelect ? inst.options.multiSeparator :
				(inst.options.rangeSelect ? inst.options.rangeSeparator : '\x00'));
			var dates = [];
			for (var i = 0; i < datesText.length; i++) {
				try {
					var date = plugin.parseDate(inst.options.dateFormat, datesText[i], inst.getConfig());
					if (date) {
						var found = false;
						for (var j = 0; j < dates.length; j++) {
							if (dates[j].getTime() === date.getTime()) {
								found = true;
								break;
							}
						}
						if (!found) {
							dates.push(date);
						}
					}
				}
				catch (e) {
					// Ignore
				}
			}
			dates.splice(inst.options.multiSelect || (inst.options.rangeSelect ? 2 : 1), dates.length);
			if (inst.options.rangeSelect && dates.length === 1) {
				dates[1] = dates[0];
			}
			return dates;
		},

		_update: function(elem, hidden) {
			elem = $(elem.target || elem);
			var inst = plugin._getInst(elem);
			if (!$.isEmptyObject(inst)) {
				if (inst.inline || plugin.curInst === inst) {
					if ($.isFunction(inst.options.onChangeMonthYear) && (!inst.prevDate ||
							inst.prevDate.getFullYear() !== inst.drawDate.getFullYear() ||
							inst.prevDate.getMonth() !== inst.drawDate.getMonth())) {
						inst.options.onChangeMonthYear.apply(elem[0], [inst.drawDate.getFullYear(), inst.drawDate.getMonth() + 1]);
					}
				}
				if (inst.inline) {
					var index = $('a, :input', elem).index($(':focus', elem));
					elem.html(this._generateContent(elem[0], inst));
					var focus = elem.find('a, :input');
					focus.eq(Math.max(Math.min(index, focus.length - 1), 0)).focus();
				}
				else if (plugin.curInst === inst) {
					if (!inst.div) {
						inst.div = $('<div></div>').addClass(this._popupClass).
							css({display: (hidden ? 'none' : 'static'), position: 'absolute',
								left: elem.offset().left, top: elem.offset().top + elem.outerHeight()}).
							appendTo($(inst.options.popupContainer || 'body'));
						if ($.fn.mousewheel) {
							inst.div.mousewheel(this._doMouseWheel);
						}
					}
					inst.div.html(this._generateContent(elem[0], inst));
					elem.focus();
				}
			}
		},

		_updateInput: function(elem, keyUp) {
			var inst = this._getInst(elem);
			if (!$.isEmptyObject(inst)) {
				var value = '';
				var altValue = '';
				var sep = (inst.options.multiSelect ? inst.options.multiSeparator :
					inst.options.rangeSeparator);
				var altFormat = inst.options.altFormat || inst.options.dateFormat;
				for (var i = 0; i < inst.selectedDates.length; i++) {
					value += (keyUp ? '' : (i > 0 ? sep : '') + plugin.formatDate(
						inst.options.dateFormat, inst.selectedDates[i], inst.getConfig()));
					altValue += (i > 0 ? sep : '') + plugin.formatDate(
						altFormat, inst.selectedDates[i], inst.getConfig());
				}
				if (!inst.inline && !keyUp) {
					$(elem).val(value);
				}
				$(inst.options.altField).val(altValue);
				if ($.isFunction(inst.options.onSelect) && !keyUp && !inst.inSelect) {
					inst.inSelect = true; // Prevent endless loops
					inst.options.onSelect.apply(elem, [inst.selectedDates]);
					inst.inSelect = false;
				}
			}
		},

		_getBorders: function(elem) {
			var convert = function(value) {
				return {thin: 1, medium: 3, thick: 5}[value] || value;
			};
			return [parseFloat(convert(elem.css('border-left-width'))),
				parseFloat(convert(elem.css('border-top-width')))];
		},

		_checkOffset: function(inst) {
			var base = (inst.elem.is(':hidden') && inst.trigger ? inst.trigger : inst.elem);
			var offset = base.offset();
			var browserWidth = $(window).width();
			var browserHeight = $(window).height();
			if (browserWidth === 0) {
				return offset;
			}
			var isFixed = false;
			$(inst.elem).parents().each(function() {
				isFixed = isFixed || ($(this).css('position') === 'fixed');
				return !isFixed;
			});
			var scrollX = document.documentElement.scrollLeft || document.body.scrollLeft;
			var scrollY = document.documentElement.scrollTop || document.body.scrollTop;
			var above = offset.top - (isFixed ? scrollY : 0) - inst.div.outerHeight();
			var below = offset.top - (isFixed ? scrollY : 0) + base.outerHeight();
			var alignL = offset.left - (isFixed ? scrollX : 0);
			var alignR = offset.left - (isFixed ? scrollX : 0) + base.outerWidth() - inst.div.outerWidth();
			var tooWide = (offset.left - scrollX + inst.div.outerWidth()) > browserWidth;
			var tooHigh = (offset.top - scrollY + inst.elem.outerHeight() +
				inst.div.outerHeight()) > browserHeight;
			inst.div.css('position', isFixed ? 'fixed' : 'absolute');
			var alignment = inst.options.alignment;
			if (alignment === 'topLeft') {
				offset = {left: alignL, top: above};
			}
			else if (alignment === 'topRight') {
				offset = {left: alignR, top: above};
			}
			else if (alignment === 'bottomLeft') {
				offset = {left: alignL, top: below};
			}
			else if (alignment === 'bottomRight') {
				offset = {left: alignR, top: below};
			}
			else if (alignment === 'top') {
				offset = {left: (inst.options.isRTL || tooWide ? alignR : alignL), top: above};
			}
			else { // bottom
				offset = {left: (inst.options.isRTL || tooWide ? alignR : alignL),
					top: (tooHigh ? above : below)};
			}
			offset.left = Math.max((isFixed ? 0 : scrollX), offset.left);
			offset.top = Math.max((isFixed ? 0 : scrollY), offset.top);
			return offset;
		},

		_checkExternalClick: function(event) {
			if (!plugin.curInst) {
				return;
			}
			var elem = $(event.target);
			if (elem.closest('.' + plugin._popupClass + ',.' + plugin._triggerClass).length === 0 &&
					!elem.hasClass(plugin._getMarker())) {
				plugin.hide(plugin.curInst);
			}
		},

		hide: function(elem, immediate) {
			if (!elem) {
				return;
			}
			var inst = this._getInst(elem);
			if ($.isEmptyObject(inst)) {
				inst = elem;
			}
			if (inst && inst === plugin.curInst) {
				var showAnim = (immediate ? '' : inst.options.showAnim);
				var showSpeed = inst.options.showSpeed;
				showSpeed = (showSpeed === 'normal' && $.ui &&
					parseInt($.ui.version.substring(2)) >= 8 ? '_default' : showSpeed);
				var postProcess = function() {
					if (!inst.div) {
						return;
					}
					inst.div.remove();
					inst.div = null;
					plugin.curInst = null;
					if ($.isFunction(inst.options.onClose)) {
						inst.options.onClose.apply(elem, [inst.selectedDates]);
					}
				};
				inst.div.stop();
				if ($.effects && ($.effects[showAnim] || ($.effects.effect && $.effects.effect[showAnim]))) {
					inst.div.hide(showAnim, inst.options.showOptions, showSpeed, postProcess);
				}
				else {
					var hideAnim = (showAnim === 'slideDown' ? 'slideUp' :
						(showAnim === 'fadeIn' ? 'fadeOut' : 'hide'));
					inst.div[hideAnim]((showAnim ? showSpeed : ''), postProcess);
				}
				if (!showAnim) {
					postProcess();
				}
			}
		},

		_keyDown: function(event) {
			var elem = (event.data && event.data.elem) || event.target;
			var inst = plugin._getInst(elem);
			var handled = false;
			var command = null;
			if (inst.inline || inst.div) {
				if (event.keyCode === 9) { // Tab - close
					plugin.hide(elem);
				}
				else if (event.keyCode === 13) { // Enter - select
					plugin.selectDate(elem,
						$('a.' + inst.options.renderer.highlightedClass, inst.div)[0]);
					handled = true;
				}
				else { // Command keystrokes
					for (var key in inst.options.commands) {
						if (inst.options.commands.hasOwnProperty(key)) {
							command = inst.options.commands[key];
							/* jshint -W018 */ // Dislikes !!
							if (command.keystroke.keyCode === event.keyCode &&
									!!command.keystroke.ctrlKey === !!(event.ctrlKey || event.metaKey) &&
									!!command.keystroke.altKey === event.altKey &&
									!!command.keystroke.shiftKey === event.shiftKey) {
							/* jshint +W018 */
								plugin.performAction(elem, key);
								handled = true;
								break;
							}
						}
					}
				}
			}
			else { // Show on 'current' keystroke
				command = inst.options.commands.current;
				/* jshint -W018 */ // Dislikes !!
				if (command.keystroke.keyCode === event.keyCode &&
						!!command.keystroke.ctrlKey === !!(event.ctrlKey || event.metaKey) &&
						!!command.keystroke.altKey === event.altKey &&
						!!command.keystroke.shiftKey === event.shiftKey) {
				/* jshint +W018 */
					plugin.show(elem);
					handled = true;
				}
			}
			inst.ctrlKey = ((event.keyCode < 48 && event.keyCode !== 32) || event.ctrlKey || event.metaKey);
			if (handled) {
				event.preventDefault();
				event.stopPropagation();
			}
			return !handled;
		},

		_keyPress: function(event) {
			var inst = plugin._getInst((event.data && event.data.elem) || event.target);
			if (!$.isEmptyObject(inst) && inst.options.constrainInput) {
				var ch = String.fromCharCode(event.keyCode || event.charCode);
				var allowedChars = plugin._allowedChars(inst);
				return (event.metaKey || inst.ctrlKey || ch < ' ' ||
					!allowedChars || allowedChars.indexOf(ch) > -1);
			}
			return true;
		},

		_allowedChars: function(inst) {
			var allowedChars = (inst.options.multiSelect ? inst.options.multiSeparator :
				(inst.options.rangeSelect ? inst.options.rangeSeparator : ''));
			var literal = false;
			var hasNum = false;
			var dateFormat = inst.options.dateFormat;
			for (var i = 0; i < dateFormat.length; i++) {
				var ch = dateFormat.charAt(i);
				if (literal) {
					if (ch === '\'' && dateFormat.charAt(i + 1) !== '\'') {
						literal = false;
					}
					else {
						allowedChars += ch;
					}
				}
				else {
					switch (ch) {
						case 'd':
						case 'm':
						case 'o':
						case 'w':
							allowedChars += (hasNum ? '' : '0123456789');
							hasNum = true;
							break;
						case 'y':
						case '@':
						case '!':
							allowedChars += (hasNum ? '' : '0123456789') + '-';
							hasNum = true;
							break;
						case 'J':
							allowedChars += (hasNum ? '' : '0123456789') + '-.';
							hasNum = true;
							break;
						case 'D':
						case 'M':
						case 'Y':
							return null; // Accept anything
						case '\'':
							if (dateFormat.charAt(i + 1) === '\'') {
								allowedChars += '\'';
							}
							else {
								literal = true;
							}
							break;
						default:
							allowedChars += ch;
					}
				}
			}
			return allowedChars;
		},

		_keyUp: function(event) {
			var elem = (event.data && event.data.elem) || event.target;
			var inst = plugin._getInst(elem);
			if (!$.isEmptyObject(inst) && !inst.ctrlKey && inst.lastVal !== inst.elem.val()) {
				try {
					var dates = plugin._extractDates(inst, inst.elem.val());
					if (dates.length > 0) {
						plugin.setDate(elem, dates, null, true);
					}
				}
				catch (e) {
					// Ignore
				}
			}
			return true;
		},

		_doMouseWheel: function(event, delta) {
			var elem = (plugin.curInst && plugin.curInst.elem[0]) ||
				$(event.target).closest('.' + plugin._getMarker())[0];
			if (plugin.isDisabled(elem)) {
				return;
			}
			var inst = plugin._getInst(elem);
			if (inst.options.useMouseWheel) {
				delta = (delta < 0 ? -1 : +1);
				plugin.changeMonth(elem, -inst.options[event.ctrlKey ? 'monthsToJump' : 'monthsToStep'] * delta);
			}
			event.preventDefault();
		},

		clear: function(elem) {
			var inst = this._getInst(elem);
			if (!$.isEmptyObject(inst)) {
				inst.selectedDates = [];
				this.hide(elem);
				var defaultDate = inst.get('defaultDate');
				if (inst.options.selectDefaultDate && defaultDate) {
					this.setDate(elem, plugin.newDate(defaultDate || plugin.today()));
				}
				else {
					this._updateInput(elem);
				}
			}
		},

		getDate: function(elem) {
			var inst = this._getInst(elem);
			return (!$.isEmptyObject(inst) ? inst.selectedDates : []);
		},

		setDate: function(elem, dates, endDate, keyUp, setOpt) {
			var inst = this._getInst(elem);
			if (!$.isEmptyObject(inst)) {
				if (!$.isArray(dates)) {
					dates = [dates];
					if (endDate) {
						dates.push(endDate);
					}
				}
				var minDate = inst.get('minDate');
				var maxDate = inst.get('maxDate');
				var curDate = inst.selectedDates[0];
				inst.selectedDates = [];
				for (var i = 0; i < dates.length; i++) {
					var date = plugin.determineDate(
						dates[i], null, curDate, inst.options.dateFormat, inst.getConfig());
					if (date) {
						if ((!minDate || date.getTime() >= minDate.getTime()) &&
								(!maxDate || date.getTime() <= maxDate.getTime())) {
							var found = false;
							for (var j = 0; j < inst.selectedDates.length; j++) {
								if (inst.selectedDates[j].getTime() === date.getTime()) {
									found = true;
									break;
								}
							}
							if (!found) {
								inst.selectedDates.push(date);
							}
						}
					}
				}
				inst.selectedDates.splice(inst.options.multiSelect ||
					(inst.options.rangeSelect ? 2 : 1), inst.selectedDates.length);
				if (inst.options.rangeSelect) {
					switch (inst.selectedDates.length) {
						case 1:
							inst.selectedDates[1] = inst.selectedDates[0];
							break;
						case 2:
							inst.selectedDates[1] =
								(inst.selectedDates[0].getTime() > inst.selectedDates[1].getTime() ?
								inst.selectedDates[0] : inst.selectedDates[1]);
							break;
					}
					inst.pickingRange = false;
				}
				inst.prevDate = (inst.drawDate ? plugin.newDate(inst.drawDate) : null);
				inst.drawDate = this._checkMinMax(plugin.newDate(inst.selectedDates[0] ||
					inst.get('defaultDate') || plugin.today()), inst);
				if (!setOpt) {
					this._update(elem);
					this._updateInput(elem, keyUp);
				}
			}
		},

		isSelectable: function(elem, date) {
			var inst = this._getInst(elem);
			if ($.isEmptyObject(inst)) {
				return false;
			}
			date = plugin.determineDate(date, inst.selectedDates[0] || this.today(), null,
				inst.options.dateFormat, inst.getConfig());
			return this._isSelectable(elem, date, inst.options.onDate,
				inst.get('minDate'), inst.get('maxDate'));
		},

		_isSelectable: function(elem, date, onDate, minDate, maxDate) {
			var dateInfo = (typeof onDate === 'boolean' ? {selectable: onDate} :
				(!$.isFunction(onDate) ? {} : onDate.apply(elem, [date, true])));
			return (dateInfo.selectable !== false) &&
				(!minDate || date.getTime() >= minDate.getTime()) &&
				(!maxDate || date.getTime() <= maxDate.getTime());
		},

		performAction: function(elem, action) {
			var inst = this._getInst(elem);
			if (!$.isEmptyObject(inst) && !this.isDisabled(elem)) {
				var commands = inst.options.commands;
				if (commands[action] && commands[action].enabled.apply(elem, [inst])) {
					commands[action].action.apply(elem, [inst]);
				}
			}
		},

		showMonth: function(elem, year, month, day) {
			var inst = this._getInst(elem);
			if (!$.isEmptyObject(inst) && (typeof day !== 'undefined' ||
					(inst.drawDate.getFullYear() !== year || inst.drawDate.getMonth() + 1 !== month))) {
				inst.prevDate = plugin.newDate(inst.drawDate);
				var show = this._checkMinMax((typeof year !== 'undefined' ?
					plugin.newDate(year, month, 1) : plugin.today()), inst);
				inst.drawDate = plugin.newDate(show.getFullYear(), show.getMonth() + 1,
					(typeof day !== 'undefined' ? day : Math.min(inst.drawDate.getDate(),
					plugin.daysInMonth(show.getFullYear(), show.getMonth() + 1))));
				this._update(elem);
			}
		},

		changeMonth: function(elem, offset) {
			var inst = this._getInst(elem);
			if (!$.isEmptyObject(inst)) {
				var date = plugin.add(plugin.newDate(inst.drawDate), offset, 'm');
				this.showMonth(elem, date.getFullYear(), date.getMonth() + 1);
			}
		},

		changeDay: function(elem, offset) {
			var inst = this._getInst(elem);
			if (!$.isEmptyObject(inst)) {
				var date = plugin.add(plugin.newDate(inst.drawDate), offset, 'd');
				this.showMonth(elem, date.getFullYear(), date.getMonth() + 1, date.getDate());
			}
		},

		_checkMinMax: function(date, inst) {
			var minDate = inst.get('minDate');
			var maxDate = inst.get('maxDate');
			date = (minDate && date.getTime() < minDate.getTime() ? plugin.newDate(minDate) : date);
			date = (maxDate && date.getTime() > maxDate.getTime() ? plugin.newDate(maxDate) : date);
			return date;
		},

		retrieveDate: function(elem, target) {
			var inst = this._getInst(elem);
			return ($.isEmptyObject(inst) ? null : this._normaliseDate(
				new Date(parseInt(target.className.replace(/^.*dp(-?\d+).*$/, '$1'), 10))));
		},

		selectDate: function(elem, target) {
			var inst = this._getInst(elem);
			if (!$.isEmptyObject(inst) && !this.isDisabled(elem)) {
				var date = this.retrieveDate(elem, target);
				if (inst.options.multiSelect) {
					var found = false;
					for (var i = 0; i < inst.selectedDates.length; i++) {
						if (date.getTime() === inst.selectedDates[i].getTime()) {
							inst.selectedDates.splice(i, 1);
							found = true;
							break;
						}
					}
					if (!found && inst.selectedDates.length < inst.options.multiSelect) {
						inst.selectedDates.push(date);
					}
				}
				else if (inst.options.rangeSelect) {
					if (inst.pickingRange) {
						inst.selectedDates[1] = date;
					}
					else {
						inst.selectedDates = [date, date];
					}
					inst.pickingRange = !inst.pickingRange;
				}
				else {
					inst.selectedDates = [date];
				}
				inst.prevDate = inst.drawDate = plugin.newDate(date);
				this._updateInput(elem);
				if (inst.inline || inst.pickingRange || inst.selectedDates.length <
						(inst.options.multiSelect || (inst.options.rangeSelect ? 2 : 1))) {
					this._update(elem);
				}
				else {
					this.hide(elem);
				}
			}
		},

		_generateContent: function(elem, inst) {
			var monthsToShow = inst.options.monthsToShow;
			monthsToShow = ($.isArray(monthsToShow) ? monthsToShow : [1, monthsToShow]);
			inst.drawDate = this._checkMinMax(
				inst.drawDate || inst.get('defaultDate') || plugin.today(), inst);
			var drawDate = plugin._applyMonthsOffset(plugin.newDate(inst.drawDate), inst);
			// Generate months
			var monthRows = '';
			for (var row = 0; row < monthsToShow[0]; row++) {
				var months = '';
				for (var col = 0; col < monthsToShow[1]; col++) {
					months += this._generateMonth(elem, inst, drawDate.getFullYear(),
						drawDate.getMonth() + 1, inst.options.renderer, (row === 0 && col === 0));
					plugin.add(drawDate, 1, 'm');
				}
				monthRows += this._prepare(inst.options.renderer.monthRow, inst).replace(/\{months\}/, months);
			}
			var picker = this._prepare(inst.options.renderer.picker, inst).replace(/\{months\}/, monthRows).
				replace(/\{weekHeader\}/g, this._generateDayHeaders(inst, inst.options.renderer));
			// Add commands
			var addCommand = function(type, open, close, name, classes) {
				if (picker.indexOf('{' + type + ':' + name + '}') === -1) {
					return;
				}
				var command = inst.options.commands[name];
				var date = (inst.options.commandsAsDateFormat ? command.date.apply(elem, [inst]) : null);
				picker = picker.replace(new RegExp('\\{' + type + ':' + name + '\\}', 'g'),
					'<' + open + (command.status ? ' title="' + inst.options[command.status] + '"' : '') +
					' class="' + inst.options.renderer.commandClass + ' ' +
					inst.options.renderer.commandClass + '-' + name + ' ' + classes +
					(command.enabled(inst) ? '' : ' ' + inst.options.renderer.disabledClass) + '">' +
					(date ? plugin.formatDate(inst.options[command.text], date, inst.getConfig()) :
					inst.options[command.text]) + '</' + close + '>');
			};
			for (var key in inst.options.commands) {
				if (inst.options.commands.hasOwnProperty(key)) {
					addCommand('button', 'button type="button"', 'button', key,
						inst.options.renderer.commandButtonClass);
					addCommand('link', 'a href="javascript:void(0)"', 'a', key,
						inst.options.renderer.commandLinkClass);
				}
			}
			picker = $(picker);
			if (monthsToShow[1] > 1) {
				var count = 0;
				$(inst.options.renderer.monthSelector, picker).each(function() {
					var nth = ++count % monthsToShow[1];
					$(this).addClass(nth === 1 ? 'first' : (nth === 0 ? 'last' : ''));
				});
			}
			// Add datepicker behaviour
			var self = this;
			function removeHighlight() {
				/* jshint -W040 */
				(inst.inline ? $(this).closest('.' + self._getMarker()) : inst.div).
					find(inst.options.renderer.daySelector + ' a').
					removeClass(inst.options.renderer.highlightedClass);
				/* jshint +W040 */
			}
			picker.find(inst.options.renderer.daySelector + ' a').hover(
					function() {
						removeHighlight.apply(this);
						$(this).addClass(inst.options.renderer.highlightedClass);
					},
					removeHighlight).
				click(function() {
					self.selectDate(elem, this);
				}).end().
				find('select.' + this._monthYearClass + ':not(.' + this._anyYearClass + ')').
				change(function() {
					var monthYear = $(this).val().split('/');
					self.showMonth(elem, parseInt(monthYear[1], 10), parseInt(monthYear[0], 10));
				}).end().
				find('select.' + this._anyYearClass).click(function() {
					$(this).css('visibility', 'hidden').
						next('input').css({left: this.offsetLeft, top: this.offsetTop,
						width: this.offsetWidth, height: this.offsetHeight}).show().focus();
				}).end().
				find('input.' + self._monthYearClass).change(function() {
					try {
						var year = parseInt($(this).val(), 10);
						year = (isNaN(year) ? inst.drawDate.getFullYear() : year);
						self.showMonth(elem, year, inst.drawDate.getMonth() + 1, inst.drawDate.getDate());
					}
					catch (e) {
						window.alert(e);
					}
				}).keydown(function(event) {
					if (event.keyCode === 13) { // Enter
						$(event.elem).change();
					}
					else if (event.keyCode === 27) { // Escape
						$(event.elem).hide().prev('select').css('visibility', 'visible');
						inst.elem.focus();
					}
				});
			// Add keyboard handling
			var data = {elem: inst.elem[0]};
			picker.keydown(data, this._keyDown).keypress(data, this._keyPress).keyup(data, this._keyUp);
			// Add command behaviour
			picker.find('.' + inst.options.renderer.commandClass).click(function() {
					if (!$(this).hasClass(inst.options.renderer.disabledClass)) {
						var action = this.className.replace(
							new RegExp('^.*' + inst.options.renderer.commandClass + '-([^ ]+).*$'), '$1');
						plugin.performAction(elem, action);
					}
				});
			// Add classes
			if (inst.options.isRTL) {
				picker.addClass(inst.options.renderer.rtlClass);
			}
			if (monthsToShow[0] * monthsToShow[1] > 1) {
				picker.addClass(inst.options.renderer.multiClass);
			}
			if (inst.options.pickerClass) {
				picker.addClass(inst.options.pickerClass);
			}
			// Resize
			$('body').append(picker);
			var width = 0;
			picker.find(inst.options.renderer.monthSelector).each(function() {
				width += $(this).outerWidth();
			});
			picker.width(width / monthsToShow[0]);
			// Pre-show customisation
			if ($.isFunction(inst.options.onShow)) {
				inst.options.onShow.apply(elem, [picker, inst]);
			}
			return picker;
		},

		_generateMonth: function(elem, inst, year, month, renderer, first) {
			var daysInMonth = plugin.daysInMonth(year, month);
			var monthsToShow = inst.options.monthsToShow;
			monthsToShow = ($.isArray(monthsToShow) ? monthsToShow : [1, monthsToShow]);
			var fixedWeeks = inst.options.fixedWeeks || (monthsToShow[0] * monthsToShow[1] > 1);
			var firstDay = inst.options.firstDay;
			var leadDays = (plugin.newDate(year, month, 1).getDay() - firstDay + 7) % 7;
			var numWeeks = (fixedWeeks ? 6 : Math.ceil((leadDays + daysInMonth) / 7));
			var selectOtherMonths = inst.options.selectOtherMonths && inst.options.showOtherMonths;
			var minDate = (inst.pickingRange ? inst.selectedDates[0] : inst.get('minDate'));
			var maxDate = inst.get('maxDate');
			var showWeeks = renderer.week.indexOf('{weekOfYear}') > -1;
			var today = plugin.today();
			var drawDate = plugin.newDate(year, month, 1);
			plugin.add(drawDate, -leadDays - (fixedWeeks && (drawDate.getDay() === firstDay) ? 7 : 0), 'd');
			var ts = drawDate.getTime();
			// Generate weeks
			var weeks = '';
			for (var week = 0; week < numWeeks; week++) {
				var weekOfYear = (!showWeeks ? '' : '<span class="dp' + ts + '">' +
					($.isFunction(inst.options.calculateWeek) ? inst.options.calculateWeek(drawDate) : 0) + '</span>');
				var days = '';
				for (var day = 0; day < 7; day++) {
					var selected = false;
					if (inst.options.rangeSelect && inst.selectedDates.length > 0) {
						selected = (drawDate.getTime() >= inst.selectedDates[0] &&
							drawDate.getTime() <= inst.selectedDates[1]);
					}
					else {
						for (var i = 0; i < inst.selectedDates.length; i++) {
							if (inst.selectedDates[i].getTime() === drawDate.getTime()) {
								selected = true;
								break;
							}
						}
					}

					var dateInfo = (!$.isFunction(inst.options.onDate) ? {} : inst.options.onDate.apply(elem, [drawDate, drawDate.getMonth() + 1 === month]));

					var selectable = (selectOtherMonths || drawDate.getMonth() + 1 === month) && this._isSelectable(elem, drawDate, dateInfo.selectable, minDate, maxDate);

					var id = ' id="item_' + drawDate.getDate() + "_" + (drawDate.getMonth() + 1) + "_" + drawDate.getFullYear() + '"';

					var hoy = "<td "+id+">{day}</td>";
					if(selected && (selectOtherMonths || drawDate.getMonth() + 1 === month) ){
						hoy = "<td "+id+" class='"+renderer.selectedClass+"'>{day}</td>";
					}

					days += this._prepare(hoy, inst).replace(/\{day\}/g,
						(selectable ? '<a href="javascript:void(0)"' : '<span') +
						' class="dp' + ts + ' ' + (dateInfo.dateClass || '') +
						(selected && (selectOtherMonths || drawDate.getMonth() + 1 === month) ?
						// ' ' + renderer.selectedClass : '') +
						' ' : '') +
						(selectable ? ' ' + renderer.defaultClass : '') +
						((drawDate.getDay() || 7) < 6 ? '' : ' ' + renderer.weekendClass) +
						(drawDate.getMonth() + 1 === month ? '' : ' ' + renderer.otherMonthClass) +
						(drawDate.getTime() === today.getTime() && (drawDate.getMonth() + 1) === month ?
						' ' + renderer.todayClass : '') +
						(drawDate.getTime() === inst.drawDate.getTime() && (drawDate.getMonth() + 1) === month ?
						' ' + renderer.highlightedClass : '') + '"' +

						(dateInfo.title || (inst.options.dayStatus && selectable) ? ' title="' +
						(dateInfo.title || plugin.formatDate(
						inst.options.dayStatus, drawDate, inst.getConfig())) + '"' : '') + '>' +
						(inst.options.showOtherMonths || (drawDate.getMonth() + 1) === month ?
						dateInfo.content || drawDate.getDate() : '&#160;') +
						(selectable ? '</a>' : '</span>'));
					plugin.add(drawDate, 1, 'd');
					ts = drawDate.getTime();
				}
				weeks += this._prepare(renderer.week, inst).replace(/\{days\}/g, days).
					replace(/\{weekOfYear\}/g, weekOfYear);
			}
			var monthHeader = this._prepare(renderer.month, inst).match(/\{monthHeader(:[^\}]+)?\}/);
			monthHeader = (monthHeader[0].length <= 13 ? 'MM yyyy' :
				monthHeader[0].substring(13, monthHeader[0].length - 1));
			monthHeader = (first ? this._generateMonthSelection(
				inst, year, month, minDate, maxDate, monthHeader, renderer) :
				plugin.formatDate(monthHeader, plugin.newDate(year, month, 1), inst.getConfig()));
			var weekHeader = this._prepare(renderer.weekHeader, inst).
				replace(/\{days\}/g, this._generateDayHeaders(inst, renderer));
			return this._prepare(renderer.month, inst).replace(/\{monthHeader(:[^\}]+)?\}/g, monthHeader).
				replace(/\{weekHeader\}/g, weekHeader).replace(/\{weeks\}/g, weeks);
		},

		_generateDayHeaders: function(inst, renderer) {
			var header = '';
			for (var day = 0; day < 7; day++) {
				var dow = (day + inst.options.firstDay) % 7;
				header += this._prepare(renderer.dayHeader, inst).replace(/\{day\}/g,
					'<span class="' + this._curDoWClass + dow + '" title="' +
					inst.options.dayNames[dow] + '">' + inst.options.dayNamesMin[dow] + '</span>');
			}
			return header;
		},

		_generateMonthSelection: function(inst, year, month, minDate, maxDate, monthHeader) {
			if (!inst.options.changeMonth) {
				return plugin.formatDate( monthHeader, plugin.newDate(year, month, 1), inst.getConfig() );
			}
			// Months
			var monthNames = inst.options['monthNames' + (monthHeader.match(/mm/i) ? '' : 'Short')];
			var html = monthHeader.replace(/m+/i, '\\x2E').replace(/y+/i, '\\x2F');
			var selector = '<select class="' + this._monthYearClass +
				'" title="' + inst.options.monthStatus + '">';
			for (var m = 1; m <= 12; m++) {
				if ((!minDate || plugin.newDate(year, m, plugin.daysInMonth(year, m)).
						getTime() >= minDate.getTime()) &&
						(!maxDate || plugin.newDate(year, m, 1).getTime() <= maxDate.getTime())) {
					selector += '<option value="' + m + '/' + year + '"' +
						(month === m ? ' selected="selected"' : '') + '>' +
						monthNames[m - 1] + '</option>';
				}
			}
			selector += '</select>';
			html = html.replace(/\\x2E/, selector);
			// Years
			var yearRange = inst.options.yearRange;
			if (yearRange === 'any') {
				selector = '<select class="' + this._monthYearClass + ' ' + this._anyYearClass +
					'" title="' + inst.options.yearStatus + '">' +
					'<option>' + year + '</option></select>' +
					'<input class="' + this._monthYearClass + ' ' + this._curMonthClass +
					month + '" value="' + year + '">';
			}
			else {
				yearRange = yearRange.split(':');
				var todayYear = plugin.today().getFullYear();
				var start = (yearRange[0].match('c[+-].*') ? year + parseInt(yearRange[0].substring(1), 10) :
					((yearRange[0].match('[+-].*') ? todayYear : 0) + parseInt(yearRange[0], 10)));
				var end = (yearRange[1].match('c[+-].*') ? year + parseInt(yearRange[1].substring(1), 10) :
					((yearRange[1].match('[+-].*') ? todayYear : 0) + parseInt(yearRange[1], 10)));
				selector = '<select class="' + this._monthYearClass +
					'" title="' + inst.options.yearStatus + '">';
				start = plugin.add(plugin.newDate(start + 1, 1, 1), -1, 'd');
				end = plugin.newDate(end, 1, 1);
				var addYear = function(y, yDisplay) {
					if (y !== 0) {
						if( yDisplay == undefined ){
							selector += '<option value="' + month + '/' + y + '"' + (year === y ? ' selected="selected"' : '') + '>' + y + '</option>';
						}
					}
				};
				var earlierLater = null;
				var y = null;
				if (start.getTime() < end.getTime()) {
					start = (minDate && minDate.getTime() > start.getTime() ? minDate : start).getFullYear();
					end = (maxDate && maxDate.getTime() < end.getTime() ? maxDate : end).getFullYear();
					earlierLater = Math.floor((end - start) / 2);
					if (!minDate || minDate.getFullYear() < start) {
						addYear(start - earlierLater, inst.options.earlierText);
					}
					for (y = start; y <= end; y++) {
						addYear(y);
					}
					if (!maxDate || maxDate.getFullYear() > end) {
						addYear(end + earlierLater, inst.options.laterText);
					}
				}
				else {
					start = (maxDate && maxDate.getTime() < start.getTime() ? maxDate : start).getFullYear();
					end = (minDate && minDate.getTime() > end.getTime() ? minDate : end).getFullYear();
					earlierLater = Math.floor((start - end) / 2);
					if (!maxDate || maxDate.getFullYear() > start) {
						addYear(start + earlierLater, inst.options.earlierText);
					}
					for (y = start; y >= end; y--) {
						addYear(y);
					}
					if (!minDate || minDate.getFullYear() < end) {
						addYear(end - earlierLater, inst.options.laterText);
					}
				}
				selector += '</select>';
			}
			html = html.replace(/\\x2F/, selector);
			return html;
		},

		_prepare: function(text, inst) {
			var replaceSection = function(type, retain) {
				while (true) {
					var start = text.indexOf('{' + type + ':start}');
					if (start === -1) {
						return;
					}
					var end = text.substring(start).indexOf('{' + type + ':end}');
					if (end > -1) {
						text = text.substring(0, start) +
							(retain ? text.substr(start + type.length + 8, end - type.length - 8) : '') +
							text.substring(start + end + type.length + 6);
					}
				}
			};
			replaceSection('inline', inst.inline);
			replaceSection('popup', !inst.inline);
			var pattern = /\{l10n:([^\}]+)\}/;
			var matches = null;
			while ((matches = pattern.exec(text))) {
				text = text.replace(matches[0], inst.options[matches[1]]);
			}
			return text;
		}
	});

	var plugin = $.datepick; // Singleton instance

	$(function() {
		$(document).on('mousedown.' + pluginName, plugin._checkExternalClick).
			on('resize.' + pluginName, function() { plugin.hide(plugin.curInst); });
	});

})(jQuery);
