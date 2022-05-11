
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


/** ---------------------------------------------------------------------
 * kintoneで検索するためのクエリを作成する関数
 * @param {Object} obj      - selectedオブジェクト
 * @param {Boolean} isScout - true | false
 --------------------------------------------------------------------- */
function _getQueryText(obj, isScout) {
  const aryQuery = [
    'LINEユーザーID!=""',
    '友達状態 in ("友だち")'
  ];

  for (const KEY in obj) {
    const NEW_VALUE = obj[KEY];
    if (Array.isArray(NEW_VALUE)) {
      // 配列
      if (!NEW_VALUE) continue;
      if (NEW_VALUE.length < 1) continue;
      let objyQuery = {
        [KEY]: []
      };
      for (const INDEX in NEW_VALUE) {
        objyQuery[KEY].push(`"${NEW_VALUE[INDEX]}"`);
      }
      aryQuery.push(`${KEY} in (${objyQuery[KEY].join(", ")})`);
    } else {
      // 文字列
      if (!NEW_VALUE) continue;
      if (NEW_VALUE.length < 1) continue;
      switch (KEY) {
        case '郵便番号':
        case '市名':
          aryQuery.push(`${KEY} like "${NEW_VALUE}"`);
          break;
        default:
          aryQuery.push(`${KEY}="${NEW_VALUE}"`);
          break;
      }
    }
  }

  if (isScout) {
    aryQuery.push('求人配信 in ("受け取る")');
    if (!aryQuery.find(v => v.includes('年齢_年_'))) aryQuery.push('年齢_年_ >= 16');
  }

  return aryQuery.join(' and ');
}