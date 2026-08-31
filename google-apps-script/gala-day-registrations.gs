/**
 * Backend for the MiniRoos Gala Day registration form + dashboard.
 * Deploy this bound to a Google Sheet — see README.md "MiniRoos Gala Day registration" for setup steps.
 *
 * doPost  — called by the public registration form at /gala-day/register. Appends one row per team.
 * doGet   — called by the password-gated dashboard at /gala-day/dashboard. Returns all rows as JSON,
 *           but only if the caller supplies the correct `key` query parameter.
 */

// Change this before deploying, then use the same value on the dashboard page when it asks for a password.
var API_KEY = 'CHANGE_ME_SHARED_PASSWORD';

var SHEET_NAME = 'Registrations';

var COLUMNS = [
	'timestamp',
	'registrant_name',
	'club_name',
	'is_host_club',
	'age_group',
	'entry_fee',
	'team_name',
	'team_grade',
	'player_count',
	'players_list',
	'official_name',
	'official_phone',
	'duty_officer_name',
	'duty_officer_phone',
	'canteen_bbq_helpers',
	'game_leaders'
];

function getSheet_() {
	var ss = SpreadsheetApp.getActiveSpreadsheet();
	var sheet = ss.getSheetByName(SHEET_NAME);
	if (!sheet) {
		sheet = ss.insertSheet(SHEET_NAME);
	}
	if (sheet.getLastRow() === 0) {
		sheet.appendRow(COLUMNS);
		sheet.setFrozenRows(1);
	}
	return sheet;
}

function jsonResponse_(obj) {
	return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
	try {
		var data = JSON.parse(e.postData.contents);

		// Honeypot: if the hidden field was filled in, it's almost certainly a bot. Pretend success.
		if (data.website) {
			return jsonResponse_({ ok: true });
		}

		var sheet = getSheet_();
		var row = COLUMNS.map(function (key) {
			if (key === 'timestamp') return new Date();
			return data[key] !== undefined ? data[key] : '';
		});
		sheet.appendRow(row);

		return jsonResponse_({ ok: true });
	} catch (err) {
		return jsonResponse_({ ok: false, error: String(err) });
	}
}

function doGet(e) {
	var key = e.parameter.key;
	if (key !== API_KEY) {
		return jsonResponse_({ error: 'unauthorized' });
	}

	var sheet = getSheet_();
	var values = sheet.getDataRange().getValues();
	var headers = values.shift();

	var rows = values.map(function (row) {
		var obj = {};
		headers.forEach(function (header, i) {
			var value = row[i];
			obj[header] = value instanceof Date ? value.toISOString() : value;
		});
		return obj;
	});

	return jsonResponse_(rows);
}
