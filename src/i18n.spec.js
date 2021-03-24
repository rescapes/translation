import en from './translations/en/en.json';
import i18next from 'i18next';
import {i18nTask, mergedResources} from './i18n.js';
import * as R from 'ramda';
import {composeWithChain, defaultRunConfig, omitDeepBy} from '@rescapes/ramda';
import T from 'folktale/concurrency/task/index.js';

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
            [
              // Just test these languages
              'en', 'en-us', 'no', 'no-nb', 'no-nn',
              'lng', 'resources', 'translation',
              // Just test these keys
              'hello world', 'colloquial hello world']
          );
        },
        mergedResources()
      )
    ).toEqual(expected);
  });

  test('mergedResourcesWithCallers', () => {
    const callerResources = {
      "en": {
        "default": {
          "resources": {
            "en": {
              "translation": {
                // Override
                "hello world": "hello dog"
              }
            }
          }
        }
      },
      "no": {
        "default": {
          "resources": {
            "no": {
              "translation": {
                // Addition
                "goodbye": "ha det bra"
              }
            }
          }
        }
      }
    };
    const expected = {
      "en": {"translation": {"colloquial hello world": "hi world", "hello world": "hello dog"}},
      "en-us": {"translation": {"colloquial hello world": "howdy world", "hello world": "hello dog"}},
      "no": {"translation": {"hello world": "hei", "goodbye": "ha det bra"}},
      "no-nb": {"translation": {"hello world": "hei verden", "goodbye": "ha det bra"}},
      "no-nn": {"translation": {"hello world": "hei verd", "goodbye": "ha det bra"}}
    };
    expect(
      omitDeepBy((key, value) => {
          // Filter all resources for our expected data
          return R.complement(R.includes)(key,
            [
              // Just test these languages
              'en', 'en-us', 'no', 'no-nb', 'no-nn',
              'lng', 'resources', 'translation',
              // Just test these keys
              'hello world', 'colloquial hello world', 'goodbye']
          );
        },
        mergedResources(callerResources)
      )
    ).toEqual(expected);
  });

  test('i18nInstanceTest', done => {
    const errors = [];
    composeWithChain([
      i18next => fromPromised(lang => {
        return i18next.changeLanguage(lang);
      })('no-nn'),
      () => i18nTask()
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
        return i18next.changeLanguage(lang);
      })('en-us'),
      () => i18nTask()
    ])().run().listen(defaultRunConfig({
      onResolved: t => {
        expect(t('colloquial hello world')).toEqual('howdy world');
      }
    }, errors, done));
  });
});
