/* Postcode coverage helper shared by the home page and the quote flow. */
(function () {
  var COVER = { BN20: 'Eastbourne', BN21: 'Eastbourne', BN22: 'Eastbourne', BN23: 'Eastbourne', BN24: '', TN39: 'Bexhill', TN40: 'Bexhill' };
  function check(raw) {
    var s = String(raw || '').toUpperCase().replace(/\s+/g, '');
    var full = s.match(/^([A-Z]{1,2}\d[A-Z\d]?)(\d[A-Z]{2})$/);
    var out = s.match(/^[A-Z]{1,2}\d[A-Z\d]?$/);
    if (!full && !out) return { valid: false };
    var district = full ? full[1] : s;
    var pretty = full ? district + ' ' + full[2] : district;
    return { valid: true, district: district, pretty: pretty, covered: Object.prototype.hasOwnProperty.call(COVER, district), town: COVER[district] || '' };
  }
  window.HB = window.HB || {};
  window.HB.checkPostcode = check;
})();
