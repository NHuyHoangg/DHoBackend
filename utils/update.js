const { formattedPrice, formatDateAgo } = require("./format");

const getUpdatedRows = (postResult) => {
  return postResult.map((row) => {
    const updatedRow = { ...row };
    updatedRow.date_ago = formatDateAgo(row.date);
    updatedRow.formatted_price = formattedPrice(row.price);
    updatedRow.case_size_num = row.case_size
      ? Number(row.case_size.match(/\d+/)[0])
      : null;
    updatedRow.province = row.province
      ? row.province.replace("Thành phố", "TP.").replace("Tỉnh", "").trim()
      : "Chưa có";
    updatedRow.media_content = row.media_content
      ? row.media_content
      : "https://d1rkccsb0jf1bk.cloudfront.net/products/99982337/main/99982337_v_1437123426-1451931916-7024.jpg";
    return updatedRow;
  });
};

module.exports = getUpdatedRows;
