$(function() {
	setupButtonListeners();
});

var infer = function() {
	$('#output').html("Loading...");
	$("#resultContainer").show();
	$('html').scrollTop(100000);

	getSettingsFromForm(function(settings) {
		settings.error = function(xhr) {
			$('#output').html("").append([
				"Error loading response.",
				"",
				"Check your API key, model, version,",
				"and other parameters",
				"then try again."
				].join("\n"));
		};

		$.ajax(settings).then(function(response) {
			if(settings.format == "json") {
				var pretty = $('<pre>');
				var formatted = JSON.stringify(response, null, 4)

				pretty.html(formatted);
				$('#output').html("").append(pretty);
				$('html').scrollTop(100000);
			} else {
				var arrayBufferView = new Uint8Array(response);
				var blob = new Blob([arrayBufferView], {
					'type': 'image\/jpeg'
				});
				var base64image = window.URL.createObjectURL(blob);

				var img = $('<img/>');
				img.get(0).onload = function() {
					$('html').scrollTop(100000);
				};
				img.attr('src', base64image);
				$('#output').html("").append(img);
			}
		});
	});
};

var setupButtonListeners = function() {
	// run inference when the form is submitted
	$('#inputForm').submit(function() {
		infer();
		return false;
	});

	// make the buttons blue when clicked
	// and show the proper "Select file" or "Enter url" state
	$('.bttn').click(function() {
		$(this).parent().find('.bttn').removeClass('active');
		$(this).addClass('active');

		$('#fileSelectionContainer').show();
		$('#urlContainer').hide();

		$('#imageOptions').show();


		return false;
	});

	// wire styled button to hidden file input
	$('#fileMock').click(function() {
		$('#file').click();
	});

	// grab the filename when a file is selected
	$("#file").change(function() {
		var path = $(this).val().replace(/\\/g, "/");
		var parts = path.split("/");
		var filename = parts.pop();
		$('#fileName').val(filename);
	});
};

var getSettingsFromForm = function(cb) {
	var settings = {
		method: "POST",
	};

	//roboflow API

	var parts = [
		"https://detect.roboflow.com/",
		"bread-type",
		"/",
		"1",
		"?api_key=8X1CsRPpbJWhvmLkNmGS"
		];

	var classes = $('#classes').val();
	if(classes) parts.push("&classes=" + classes);

	var confidence = 20;
	if(confidence) parts.push("&confidence=" + confidence);

	var overlap = 50;
	if(overlap) parts.push("&overlap=" + overlap);


	//format image / json
	var format = "image";
	parts.push("&format=" + format);
	settings.format = format;


	//show image
	if(format == "image") {
		var labels = "on";
		if(labels) parts.push("&labels=on");

		var stroke = 2;
		if(stroke) parts.push("&stroke=" + stroke);

		settings.xhr = function() {
			var override = new XMLHttpRequest();
			override.responseType = 'arraybuffer';
			return override;
		}
	}


	//(method == "upload") {
	var file = $('#file').get(0).files && $('#file').get(0).files.item(0);
	if(!file) return alert("Please select a file.");

	getBase64fromFile(file).then(function(base64image) {
		settings.url = parts.join("");
		settings.data = base64image;

		console.log(settings);
		cb(settings);
	});

};

var getBase64fromFile = function(file) {
	return new Promise(function(resolve, reject) {
		var reader = new FileReader();
		reader.readAsDataURL(file);
		reader.onload = function() {
			resolve(reader.result);
		};
		reader.onerror = function(error) {
			reject(error);
		};
	});
};

var resizeImage = function(base64Str) {
	return new Promise(function(resolve, reject) {
		var img = new Image();
		img.src = base64Str;
		img.onload = function(){
			var canvas = document.createElement("canvas");
			var MAX_WIDTH = 1500;
			var MAX_HEIGHT = 1500;
			var width = img.width;
			var height = img.height;
			if (width > height) {
				if (width > MAX_WIDTH) {
					height *= MAX_WIDTH / width;
					width = MAX_WIDTH;
				}
			} else {
				if (height > MAX_HEIGHT) {
					width *= MAX_HEIGHT / height;
					height = MAX_HEIGHT;
				}
			}
			canvas.width = width;
			canvas.height = height;
			var ctx = canvas.getContext('2d');
			ctx.drawImage(img, 0, 0, width, height);
			resolve(canvas.toDataURL('image/jpeg', 1.0));  
		};

	});	
};