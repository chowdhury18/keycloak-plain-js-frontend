var auth_realm_endpoint = "http://192.168.33.40:30000/auth/realms/Demo-Realm/protocol/openid-connect"
var app_redirect_uri = "http://localhost:9091/authCodeReader.html";
var root_url = "http://localhost:9091";
var app_client_id = "keycloak-plain-js";
var app_url = "http://127.0.0.1:9090/api/resources";

function generateState(length) {
	var stateValue = "";
	var alphaNumericCharacters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	var alphaNumericCharactersLength = alphaNumericCharacters.length;
	for (var i = 0; i < length; i++) {
		stateValue += alphaNumericCharacters.charAt(Math.floor(Math.random() * alphaNumericCharactersLength));
	}

	document.getElementById("stateValue").innerHTML = stateValue;
}

function generateCodeVerifier() {
	var returnValue = "";
	var randomByteArray = new Uint8Array(32);
	window.crypto.getRandomValues(randomByteArray);

	returnValue = base64urlencode(randomByteArray);

	document.getElementById("codeVerifierValue").innerHTML = returnValue;
}

async function generateCodeChallenge() {
	var codeChallengeValue = "";

	var codeVerifier = document.getElementById("codeVerifierValue").innerHTML;

	var textEncoder = new TextEncoder('US-ASCII');
	var encodedValue = textEncoder.encode(codeVerifier);
	var digest = await window.crypto.subtle.digest("SHA-256", encodedValue);

	codeChallengeValue = base64urlencode(Array.from(new Uint8Array(digest)));

	document.getElementById("codeChallengeValue").innerHTML = codeChallengeValue;
}

function base64urlencode(sourceValue) {
	var stringValue = String.fromCharCode.apply(null, sourceValue);
	var base64Encoded = btoa(stringValue);
	var base64urlEncoded = base64Encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
	return base64urlEncoded;
}

function getAuthCode() {
	var codeChallenge = document.getElementById("codeChallengeValue").innerHTML;
	var state = document.getElementById("stateValue").innerHTML;

	var authorizationURL = auth_realm_endpoint + "/auth";
	authorizationURL += "?client_id=" + app_client_id;
	authorizationURL += "&response_type=code";
	authorizationURL += "&scope=openid";
	authorizationURL += "&redirect_uri=" + app_redirect_uri;
	authorizationURL += "&state=" + state;
	authorizationURL += "&code_challenge=" + codeChallenge;
	authorizationURL += "&code_challenge_method=S256";

	window.open(authorizationURL, 'authorizationRequestWindow', 'width=800,height=600,left=200,top=200');
};

function postAuthorize(state, authCode) {
	var originalStateValue = document.getElementById("stateValue").innerHTML;
	if(state === originalStateValue) {
		requestTokens(authCode);
	} else {
		alert("Invalid state value received");
	}
}

function requestTokens(authCode) {
	var codeVerifier = document.getElementById("codeVerifierValue").innerHTML;
	var data = {
		"grant_type": "authorization_code",
		"client_id": app_client_id,
		"code": authCode,
		"code_verifier": codeVerifier,
		"redirect_uri": app_redirect_uri
	};

	$.ajax({
		beforeSend: function (request) {
			request.setRequestHeader("Content-type", "application/x-www-form-urlencoded; charset=UTF-8");
		},
		type: "POST",
		url: auth_realm_endpoint + "/token",
		data: data,
		success: postRequestAccessToken,
		error: errorMethod,
		dataType: "json"
	});
}

function getAllResources() {
	var authorization =  "bearer " + document.getElementById("accessToken").innerHTML;
	var header = {
		"Authorization": authorization,
		"Access-Control-Allow-Origin" : root_url
	};

	$.ajax({
		beforeSend: function (request) {
				request.setRequestHeader("Content-type", "application/json; charset=UTF-8");
			},
		type: "GET",
		url: app_url,
		headers: header,
		dataType: "json",
		success: successResponse,
		error: failureResponse,
	});
}

function logout(){
  var idToken = document.getElementById("idToken").innerHTML;
  var logoutURL = auth_realm_endpoint + "/logout";
  logoutURL += "?id_token_hint=" + idToken;
  logoutURL += "&post_logout_redirect_uri=" + root_url;
  window.location.href = logoutURL;
}

function successResponse(data, status, jqXHR) {
	document.getElementById("result").innerHTML = data;
}

function failureResponse(data, status, jqXHR) {
	document.getElementById("result").innerHTML = data;
}

function postRequestAccessToken(data, status, jqXHR) {
	document.getElementById("accessToken").innerHTML = data["access_token"];
	document.getElementById("idToken").innerHTML = data["id_token"];
}

function errorMethod(data, status, jqXHR) {
	alert(status);
}

function copy(item) {
  let textarea = document.getElementById(item);
  textarea.select();
  document.execCommand("copy");
}

