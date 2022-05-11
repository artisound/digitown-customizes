
/** ************************************************************
 * Get the URL parameter value
 *
 * @param  name {string} パラメータのキー文字列
 * @return  url {url} 対象のURL文字列（任意）
 ************************************************************ */
function getParam(name, url) {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, "\\$&");
  var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
    results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}

/** ************************************************************
 * 郵便番号にハイフンを自動挿入する
 * @param   {String}  zipcode   - 郵便番号
 * @param   {Boolean} addHyphen - true | false
 * @returns {string}            - ハイフン付きの郵便番号
 ************************************************************ */
function zipcodeAutoHyphen(zipcode, addHyphen = true) {
  // 入力値が3文字以下であれば、そのまま出力
  if (zipcode.length < 4) return zipcode;
  const zip = zipcode.replace(/-/g, '').slice( 0, 7 );
  return addHyphen ? zip.slice(0, 3) + '-' + zip.slice(3, 7) : zip;
}