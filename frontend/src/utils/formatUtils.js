/**
 * Utility functions for formatting data
 */

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Format a date object into a readable string
 * @param {Object} dateObj - Date object with year, month, and day properties
 * @returns {string} Formatted date string
 */
export const formatDate = (dateObj) => {
  if (!dateObj) return 'TBA';
  const { year, month, day } = dateObj;
  if (!year && !month && !day) return 'TBA';

  const monthName = month ? MONTHS[parseInt(month) - 1] : '';
  const formattedDay = day ? day : '';

  if (!monthName && !formattedDay) return year || 'TBA';
  if (!formattedDay) return `${monthName} ${year || 'TBA'}`;

  return `${monthName} ${formattedDay}, ${year || 'TBA'}`;
};

/**
 * Format a name string, handling null/undefined cases
 * @param {string} name - Name to format
 * @returns {string} Formatted name
 */
export const formatName = (name) => {
  if (!name) return 'Unknown';
  return name;
};

/**
 * Format a description string, handling HTML tags and line breaks
 * @param {string} description - Description to format
 * @returns {string} Formatted description
 */
export const formatDescription = (description) => {
  if (!description) return '';
  
  // First handle <b> tags by preserving them
  const preserveBoldTags = description.replace(/<b>/g, '###BOLDSTART###')
                                    .replace(/<\/b>/g, '###BOLDEND###');

  // Handle <i> tags by preserving them
  const preserveItalicTags = preserveBoldTags.replace(/<i>/g, '###ITALICSTART###')
                                            .replace(/<\/i>/g, '###ITALICEND###');

  // Split by <br> tags
  const paragraphs = preserveItalicTags.split(/<br>/);

  return paragraphs.map(paragraph => {
    // Remove closing br tags and trim whitespace
    const cleanParagraph = paragraph.replace(/<\/br>/g, '').trim();

    // Restore <b> and <i> tags
    return cleanParagraph.replace(/###BOLDSTART###/g, '<b>')
                        .replace(/###BOLDEND###/g, '</b>')
                        .replace(/###ITALICSTART###/g, '<i>')
                        .replace(/###ITALICEND###/g, '</i>');
  }).filter(p => p);
}; 