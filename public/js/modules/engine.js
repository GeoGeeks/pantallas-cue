import { Formatter } from './utils.js';

export const Engine = {
  data: [],
  filter(data, criteria) {
    return data.filter(item => {
      const q = Formatter.normalize(criteria.query);
      const matchName = Formatter.normalize(item.nombre).includes(q);
      const matchTema = !criteria.tematica || (Array.isArray(item.tematica) ? item.tematica.includes(criteria.tematica) : item.tematica === criteria.tematica);
      return matchName && matchTema;
    }).sort((a, b) => new Date(a.hora_inicio) - new Date(b.hora_inicio));
  }
};
