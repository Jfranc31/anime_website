const SEASONS = [
  'Winter', 
  'Spring', 
  'Summer', 
  'Fall'
];

const AVAILABLE_GENRES = [
  'Action',
  'Adventure',
  'Comedy',
  'Drama',
  'Ecchi',
  'Fantasy',
  'Horror',
  'Hentai',
  'Mahou Shoujo',
  'Mecha',
  'Music',
  'Mystery',
  'Psychological',
  'Romance',
  'Sci-Fi',
  'Slice of Life',
  'Sports',
  'Supernatural',
  'Thriller',
];

const ANIME_FORMATS = [
  'TV',
  'Movie',
  'OVA',
  'ONA',
  'Special',
  'Music'
];

const MANGA_FORMATS = [
  'Manga',
  'Light Novel',
  'One Shot'
];

const AIRING_STATUS = [
  'Finished Releasing',
  'Currently Releasing',
  'Not Yet Released',
  'Cancelled',
  'Hiatus'
];

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec'
];

const YEARS = (() => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let year = currentYear; year >= 1960; year--) {
    years.push(year);
  }
  return years;
})();

export { SEASONS, AVAILABLE_GENRES, ANIME_FORMATS, MANGA_FORMATS, AIRING_STATUS, YEARS, MONTHS }; 