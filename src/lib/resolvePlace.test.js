import { describe, expect, it } from 'vitest';
import { findRoutesBetweenStops, resolvePlace } from './resolvePlace.js';

const stops = [
  { id: 'wuse', name: 'Wuse' },
  { id: 'garki', name: 'Garki' },
];

describe('resolvePlace', () => {
  it('resolves the selected branch nearest stops and ignores unknown IDs', () => {
    const place = {
      id: 'sample-office',
      branches: [
        { id: 'first', nearestStopIds: ['wuse'] },
        { id: 'second', nearestStopIds: ['garki', 'missing', 'garki'] },
      ],
    };

    expect(resolvePlace(place, stops, 'second')).toEqual({
      place,
      branch: place.branches[1],
      nearestStops: [stops[1]],
    });
  });

  describe('findRoutesBetweenStops', () => {
    it('finds and deduplicates direct routes for groups of nearby stops', () => {
      const routes = [
        { id: 'to-wuse', from: 'nyanya', to: 'wuse' },
        { id: 'to-garki', from: 'nyanya', to: 'garki' },
      ];

      expect(
        findRoutesBetweenStops(
          routes,
          [{ id: 'nyanya' }],
          [{ id: 'wuse' }, { id: 'wuse' }, { id: 'missing' }],
        ),
      ).toEqual([{ ...routes[0], reversed: false }]);
    });

    it('supports a place at the starting end through reverse direct matching', () => {
      const routes = [{ id: 'wuse-garki', from: 'wuse', to: 'garki' }];

      expect(
        findRoutesBetweenStops(routes, [{ id: 'garki' }], [{ id: 'wuse' }]),
      ).toEqual([{ ...routes[0], from: 'garki', to: 'wuse', reversed: true }]);
    });
  });

  it('returns an empty nearest-stop list when IDs are missing', () => {
    const place = { id: 'sample-office', branches: [{ id: 'no-stops' }] };

    expect(resolvePlace(place, stops).nearestStops).toEqual([]);
    expect(resolvePlace(null, stops)).toBeNull();
  });
});
