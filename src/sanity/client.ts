import { createClient } from 'next-sanity';
import { apiVersion, dataset, projectId, studioUrl } from './env';

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true,
  perspective: 'published',
  stega: {
    studioUrl,
    // Veri taşıyan alanlar kodlanmaz (bkz. plan Bölüm 5).
    filter: (props) => {
      const key = props.sourcePath.at(-1);
      if (typeof key === 'string') {
        if (/(Color|Key|Url|Href|Link|Slug|Phone|Email|Whatsapp|Date|DateTime|At|Status|Value|Lat|Lng)$/.test(key)) return false;
        if (['phone', 'email', 'whatsapp', 'status', 'slug', 'lat', 'lng', 'calLink', 'formValue', 'kind', 'category'].includes(key)) return false;
      }
      return props.filterDefault(props);
    },
  },
});
