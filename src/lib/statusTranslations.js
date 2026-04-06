export const statusTranslations = {
  // Campaign statuses
  draft: "טיוטה",
  scheduled: "מתוזמן",
  running: "בתהליך",
  paused: "מושהה",
  completed: "הושלם",
  failed: "נכשל",
  archived: "בארכיון",
  
  // Message statuses
  pending: "ממתין",
  sending: "שולח...",
  sent: "נשלח",
  delivered: "נמסר",
  opened: "נפתח",
  replied: "הגיב",
  
  // Lead statuses
  new: "חדש",
  contacted: "יצור קשר",
  interested: "מעוניין",
  not_interested: "לא מעוניין",
  deal_closed: "סגור",
};

export const getStatusLabel = (key) => {
  return statusTranslations[key] || key;
};