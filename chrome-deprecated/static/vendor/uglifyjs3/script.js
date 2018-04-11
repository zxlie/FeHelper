/*global minify:false, JS_Parse_Error:false */
/*jshint globalstrict:true */

'use strict';

var default_options = {};

function $(id) {
	return document.getElementById(id);
}


// Handle the UI

var uglify_options;
var $options = $('options');
var $out = $('out');
var $in = $('in');
var $error = $('error');
var $stats = $('stats');
var $body = document.body;
var $btn_options = $('btn-options');
var $btn_options_save = $('btn-options-save');
var $cb_as_i_type = $('cb-as-i-type');


$('header-link').onclick = go_to_start;
$('btn-go').onclick = go;
$btn_options.onclick = show_options;
$btn_options_save.onclick = set_options;
$('btn-options-reset').onclick = reset_options;
$in.oninput = $in.onkeyup = $in.onblur = $in.onfocus = go_ait;
$cb_as_i_type.onclick = set_options_ait;
$out.onfocus = select_text;

var default_options_text;
set_options_initial();


function hide(class_name) {
	var names = class_name.split(' ');
	var cur = ' ' + $body.className + ' ';
	for (var i = 0; i < names.length; i++) {
		while (cur.indexOf(' ' + names[i] + ' ') >= 0) {
			cur = cur.replace(' ' + names[i] + ' ', ' ');
		}
	}

	$body.className = cur.replace(/^\s+|\s+$/g, '');
}

function show(class_name) {
	$body.className += ' ' + class_name;
}

function show_options() {
	show('s-options');
	hide('s-input');
}

function get_options(value) {
	/*jshint evil:true */
	return new Function('return (' + (value || $options.value) + ');')();
}

function set_options() {
	var old_options = uglify_options;
	try {
		uglify_options = get_options();

		// The options could be parsed. Try to update localStorage.
		try {
			if (default_options_text === $options.value)
				localStorage.removeItem('uglify-options');
			else
				localStorage.setItem('uglify-options', $options.value);
		} catch (e) {}

		// Run Uglify with the new options.
		go(true);

		show('s-input');
		hide('s-options');
		return true;
	} catch (e) {
		if (e instanceof JS_Parse_Error) {
			// the options are actually okay, just the code that's bad
			show_error(e, $in.value);
			return true;
		} else {
			uglify_options = old_options;
			show_error(e);
			return false;
		}
	}
}

function reset_options() {
	$options.value = default_options_text;
	set_options();
}

function set_options_ait() {
	try {
		if ($cb_as_i_type.checked)
			localStorage.removeItem('uglify-options-disable-ait');
		else
			localStorage.setItem('uglify-options-disable-ait', 1);
	} catch (e) {}
}

function set_options_initial() {
	default_options_text = $options.textContent || $options.innerText;
	default_options = get_options(default_options_text);

	// If there are options saved with localStorage, load them now.
	try {
		var options_text = localStorage.getItem('uglify-options');
		if (options_text) {
			$options.value = options_text;
		}
		$cb_as_i_type.checked = !localStorage.getItem('uglify-options-disable-ait');
	} catch (e) {}

	try {
		uglify_options = get_options();
	} catch (e) {
		// if it didn't work, reset the textarea
		$options.value = default_options_text;
		uglify_options = default_options;
	}
}

function encodeHTML(str) {
	return (str + '')
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/"/g, '&quot;');
}

var last_input;
function go(throw_on_error) {
	var input = $in.value;
	last_input = input;

	if (throw_on_error === true) {
		main();
	} else {
		try {
			main();
		} catch (e) {
			show_error(e, input);
		}
	}

	function main() {
		if (!input || input === $in.textContent) {
			go_to_start();
			return;
		}

		var res = minify(input, uglify_options);
		if (res.error) {
			throw res.error;
		}

		hide('s-info s-error');
		show('s-output');

		$out.value = res.code || '/* no output! */';
		$stats.innerHTML = res.code.length + ' bytes, saved ' + ((1 - res.code.length / input.length) * 100 || 0).toFixed(2) + '%';
	}
}

// As I type (AIT) functionality. Spend at least half of the time idle.
var ait_timeout;
var ait_last_duration = 50;
function go_ait() {
	if (!$cb_as_i_type.checked)
		return;

	var input = $in.value;
	if (input === last_input)
		return;

	last_input = input;
	clearTimeout(ait_timeout);
	ait_timeout = setTimeout(function () {
		var start = new Date();
		go();
		ait_last_duration = new Date() - start;
	}, ait_last_duration);
}

function show_error(e, param) {
	console.error('Error', e);
	hide('s-info s-output');
	show('s-error');

	if (e instanceof JS_Parse_Error) {
		var input = param;
		var lines = input.split('\n');
		var line = lines[e.line - 1];
		e = 'Parse error: <strong>' + encodeHTML(e.message) + '</strong>\n' +
			'<small>Line ' + e.line + ', column ' + (e.col + 1) + '</small>\n\n' +
			(lines[e.line-2] ? (e.line - 1) + ': ' + encodeHTML(lines[e.line-2]) + '\n' : '') +
			e.line + ': ' +
				encodeHTML(line.substr(0, e.col)) +
				'<mark>' + encodeHTML(line.substr(e.col, 1) || ' ') + '</mark>' +
				encodeHTML(line.substr(e.col + 1)) + '\n' +
			(lines[e.line] ? (e.line + 1) + ': ' + encodeHTML(lines[e.line]) : '');
	} else if (e instanceof Error) {
		e = e.name + ': <strong>' + encodeHTML(e.message) + '</strong>';
	} else {
		e = '<strong>' + encodeHTML(e) + '</strong>';
	}

	$error.innerHTML = e;
}

function go_to_start() {
	clearTimeout(ait_timeout);
	hide('s-options s-error s-output');
	show('s-input s-info');
	return false;
}

function select_text() {
	/*jshint validthis:true */
	var self = this;
	self.select();

	self.onmouseup = self.onkeyup = function() {
		// Prevent further mouseup intervention
		self.onmouseup = self.onkeyup = null;
		self.scrollTop = 0;
		return false;
	};
	return false;
}
