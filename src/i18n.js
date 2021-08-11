import fs from 'fs';
import T from 'folktale/concurrency/task/index.js';
import {isNode} from 'browser-or-node';

const {of} = T

export const importJsonOrJsTask = paramsFile => {
  return R.ifElse(
    R.endsWith('json'),
    file => {
      return of(JSON.parse(fs.readFileSync(file)));
    },
    file => {
      return fromPromised(() => import(file).then(({default: theDefault}) => {
          return theDefault;
        })
      )();
    }
  )(paramsFile);
};


import {
  chainObjToValues, composeWithChain,
  mapObjToValues, mapToNamedResponseAndInputs,
  mergeDeep,
  reqPathThrowing,
  taskToPromise
} from '@rescapes/ramda';
import * as R from 'ramda';
import i18n from "i18next";
import {initReactI18next} from "react-i18next";
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

const {fromPromised} = T;

const loadResources = async () => {
  const x = fileOrPromise => {
    return R.is(String, fileOrPromise) ?
      taskToPromise(importJsonOrJsTask(fileOrPromise)) :
      file => import(file).then(({default: theDefault}) => {
        return theDefault;
      })
  }
  // Duplicating strings because *#%@% webpack is complaining about dynamic imports
  const en = await x(!isNode ? import('./translations/en/en.json') : './translations/en/en.json');
  const enUS = await x(!isNode ? import('./translations/en/en-us.json') : './translations/en/en-us.json');
  const no = await x(!isNode ? import('./translations/no/no.json') : './translations/no/no.json');
  const nb = await x(!isNode ? import('./translations/no/no-nb.json') : './translations/no/no-nb.json');
  const nn = await x(!isNode ? import('./translations/no/no-nn.json') : './translations/no/no-nn.json');
  return {
    en: {
      default: en,
      us: enUS
    },
    no: {
      default: no,
      nb: nb,
      nn: nn
    }
  }
};

/**
 * Merges resources above with the caller's resources
 * @param {Object} [callerResources] Default {} In the form of resources above. Deep merged with
 * resources with this object favored
 * @returns {Object}
 */
export const mergedResources = async (callerResources = {}) => {
  const resources = await loadResources()
  const allResources = mergeDeep(resources, callerResources);
  return R.compose(
    R.fromPairs,
    resources => chainObjToValues(
      (baseLanguage, langKey) => {
        const {default: defaultObj, ...variations} = baseLanguage;
        const defaultResources = R.view(
          R.lensPath(['resources', langKey]),
          defaultObj
        );
        // Return the default with key langKey with variations concatinated.
        const defaultPair = [langKey, defaultResources];
        return R.concat([defaultPair], mapObjToValues(
          (variationObj, variationKey) => {
            // Makes the variation key pair, e.g. en-us
            const variationPairKey = R.join('-', [langKey, variationKey]);

            // Returns pairs of variations with key langKey-variationKey
            // Variations merge the default object with their object
            return [variationPairKey,
              R.compose(
                // Merge the default obj
                variationResources => {
                  return mergeDeep(
                    defaultResources,
                    variationResources
                  );
                },
                variationObj => {
                  return reqPathThrowing(['resources', variationPairKey], variationObj);
                }
              )(variationObj)
            ];
          },
          variations
        ));
      },
      resources)
  )(allResources);
};

/**
 * Returns a task that when complete indicates that i18n is initialized
 * @param {Object} [resources] If specified this is deep merged into the default resources
 * declared above. It must match the form the of the resources above.
 * @returns The task resolves to the original i18n after it's initialized
 */
export const i18nTask = (resources) => {
  return composeWithChain([
    ({mergedResources}) => fromPromised(
      mergedResources => {
        return i18n
          .use(Backend)
          .use(LanguageDetector)
          .use(initReactI18next) // bind react-i18next to the instance
          .init({
              // Merge default resources with the caller's
              resources: mergedResources,
              fallbackLng: "en",
              debug: true,
              lowerCaseLng: true,
              interpolation: {
                escapeValue: false // not needed for react!!
              }

              // react i18next special options (optional)
              // override if needed - omit if ok with defaults
              /*
              react: {
                bindI18n: 'languageChanged',
                bindI18nStore: '',
                transEmptyNodeValue: '',
                transSupportBasicHtmlNodes: true,
                transKeepBasicHtmlNodesFor: ['br', 'strong', 'i'],
                useSuspense: true,
              }
              */
            }
          ).then(() => i18n);
      }
    )(mergedResources),
    mapToNamedResponseAndInputs('mergedResources',
      ({resources}) => {
        return fromPromised(
          resources => mergedResources(resources)
        )(resources)
      })
  ])({resources});
};

