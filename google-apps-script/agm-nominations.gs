/**
 * Backend for the AGM nomination + RSVP form at /agm.
 * Deploy this bound to a Google Sheet — see README.md "AGM nominations and RSVPs" for setup steps.
 *
 * doPost — called by the form. Appends one row to the sheet and emails the details to NOTIFY_EMAIL.
 */

// Where nominations and RSVPs are sent. Replies to the email go to the person who submitted the form.
var NOTIFY_EMAIL = 'metfordcobrasfootballclub@gmail.com';

var SHEET_NAME = 'Submissions';

var COLUMNS = [
	'timestamp',
	'type',
	'name',
	'email',
	'phone',
	'connection',
	'roles',
	'attending',
	'guests',
	'experience',
	'consent',
	'comments'
];

var LABELS = {
	type: 'Submission',
	name: 'Name',
	email: 'Email',
	phone: 'Phone',
	connection: 'Connection to the club',
	roles: 'Nominating for',
	attending: 'Attending the AGM',
	guests: 'Extra guests',
	experience: 'About the nominee',
	consent: 'Nominee consent',
	comments: 'Comments / questions'
};

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

function clean_(value, maxLength) {
	return String(value === undefined || value === null ? '' : value).trim().slice(0, maxLength || 500);
}

function doPost(e) {
	try {
		var data = JSON.parse(e.postData.contents);

		// Honeypot: if the hidden field was filled in, it's almost certainly a bot. Pretend success.
		if (data.website) {
			return jsonResponse_({ ok: true });
		}

		var record = {};
		COLUMNS.forEach(function (key) {
			if (key === 'timestamp') return;
			record[key] = clean_(data[key], key === 'experience' || key === 'comments' ? 2000 : 300);
		});
		if (!record.name || !record.email) {
			return jsonResponse_({ ok: false, error: 'missing name or email' });
		}

		getSheet_().appendRow(
			COLUMNS.map(function (key) {
				return key === 'timestamp' ? new Date() : record[key];
			})
		);

		var isNomination = record.type === 'Nomination';
		var subject = isNomination
			? 'AGM nomination: ' + record.name + ' for ' + record.roles
			: 'AGM RSVP: ' + record.name;
		var lines = Object.keys(LABELS)
			.filter(function (key) {
				return record[key];
			})
			.map(function (key) {
				return LABELS[key] + ': ' + record[key];
			});
		var body =
			(isNomination ? 'A new committee nomination' : 'A new RSVP') +
			' came in from the website.\n\n' +
			lines.join('\n') +
			'\n\nReply to this email to contact ' +
			record.name +
			'. All submissions are also in the "' +
			SHEET_NAME +
			'" tab of the AGM Google Sheet.';

		var options = { name: 'Metford Cobras website' };
		if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record.email)) {
			options.replyTo = record.email;
		}
		MailApp.sendEmail(NOTIFY_EMAIL, subject, body, options);

		return jsonResponse_({ ok: true });
	} catch (err) {
		return jsonResponse_({ ok: false, error: String(err) });
	}
}
