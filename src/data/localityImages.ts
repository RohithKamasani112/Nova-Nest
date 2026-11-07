import whitefield from '../assets/localities/whitefield.jpg';
import hoodi from '../assets/localities/hoodi.jpg';
import mahadevapura from '../assets/localities/mahadevapura.jpg';

// These images decorate locality discovery only. Never write them onto listings.
export const LOCALITY_IMAGES: Record<string, { src: string; alt: string; author: string; source: string; license: string; licenseUrl: string }> = {
  whitefield: { src: whitefield, alt: 'Whitefield neighbourhood skyline, Bengaluru', author: 'Doc.aneesh', source: 'https://commons.wikimedia.org/wiki/File:Whitefield_view.jpg', license: 'CC BY-SA 3.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/' },
  hoodi: { src: hoodi, alt: 'Hoodi Metro station, Bengaluru', author: 'Chaitanya (ChaitanyaJo)', source: 'https://commons.wikimedia.org/wiki/File:Hoodi_Metro.jpg', license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/' },
  mahadevapura: { src: mahadevapura, alt: 'Phoenix Marketcity at night in Mahadevapura, Bengaluru', author: 'Veera.sj', source: 'https://commons.wikimedia.org/wiki/File:Phoenix_Mall_Bangalore_Night_View.JPG', license: 'CC0 1.0', licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/' },
};
