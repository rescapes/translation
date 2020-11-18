import en from './translations/en/en.json';
import i18next from 'i18next';
import {i18nTask, mergedResources} from './i18n.js';
import R from 'ramda';
import {composeWithChain, defaultRunConfig, omitDeepBy} from '@rescapes/ramda';
import {pickBy} from 'ramda/src/index';
import T from 'folktale/concurrency/task';

const {fromPromised} = T;

describe('translation', () => {
  test('samplei8nextTest', () => {

    i18next.init({
      lng: 'de',
      resources: {
        de: {
          translation: {
            "hello world": "hallo Welt"
          }
        }
      }
    });
    expect(i18next.t('hello world')).toEqual('hallo Welt');
  });

  test('mergedResources', () => {
    const expected = {
      "en": {"translation": {"colloquial hello world": "hi world", "hello world": "hello world"}},
      "en-us": {"translation": {"colloquial hello world": "howdy world", "hello world": "hello world"}},
      "no": {"translation": {"hello world": "hei"}},
      "no-nb": {"translation": {"hello world": "hei verden"}},
      "no-nn": {"translation": {"hello world": "hei verd"}}
    };
    expect(
      omitDeepBy((key, value) => {
          // Filter all resources for our expected data
          return R.complement(R.includes)(key,
            ['en', 'en-us', 'no', 'no-nb', 'no-nn',
              'lng', 'resources', 'translation', 'hello world', 'colloquial hello world']
          );
        },
        mergedResources()
      )
    ).toEqual(expected);
  });

  test('i18nInstanceTest', done => {
    const errors = [];
    composeWithChain([
      i18next => fromPromised(lang => {
        return i18next.changeLanguage(lang)
      })('no-nn'),
      () => i18nTask
    ])().run().listen(defaultRunConfig({
      onResolved: t => {
        expect(t('hello world')).toEqual('hei verd');
      }
    }, errors, done));
  });

  test('i18nInstanceTestVariationOverride', done => {
    const errors = [];
    composeWithChain([
      i18next => fromPromised(lang => {
        return i18next.changeLanguage(lang)
      })('en-us'),
      () => i18nTask
    ])().run().listen(defaultRunConfig({
      onResolved: t => {
        expect(t('colloquial hello world')).toEqual('howdy world');
      }
    }, errors, done));
  });
});
