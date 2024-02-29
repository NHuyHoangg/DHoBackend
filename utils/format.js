const formattedPrice = (price) => {
  if (typeof price !== "number") {
    price = Number(price);
  }
  // change price to number 

  const formatted = price.toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
  });

  if (!formatted) {
    throw new Error("Failed to format price");
  }

  return formatted;
};

const formatDateAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;
  const month = 30 * day;
  const year = 365 * day;

  if (diff < minute) {
    return "vừa xong";
  } else if (diff < hour) {
    const minutesAgo = Math.floor(diff / minute);
    return `${minutesAgo} phút trước`;
  } else if (diff < day) {
    const hoursAgo = Math.floor(diff / hour);
    return `${hoursAgo} giờ trước`;
  } else if (diff < week) {
    const daysAgo = Math.floor(diff / day);
    return `${daysAgo} ngày trước`;
  } else if (diff < month) {
    const weeksAgo = Math.floor(diff / week);
    return `${weeksAgo} tuần trước`;
  } else if (diff < year) {
    const monthsAgo = Math.floor(diff / month);
    return `${monthsAgo} tháng trước`;
  } else {
    const yearsAgo = Math.floor(diff / year);
    return `${yearsAgo} năm trước`;
  }
};
module.exports = { formattedPrice, formatDateAgo };