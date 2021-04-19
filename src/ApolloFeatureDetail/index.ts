import { ConfigurationSchema } from '@jbrowse/core/configuration'
import { ElementId } from '@jbrowse/core/util/types/mst'
import { types } from 'mobx-state-tree'
import PluginManager from '@jbrowse/core/PluginManager'
import { observable } from 'mobx'
import { getSession } from '@jbrowse/core/util'

// import { Client } from '@stomp/stompjs'

const configSchema = ConfigurationSchema('ApolloWidget', {})

export default function stateModelFactory(pluginManager: PluginManager) {
  return types
    .model('ApolloWidget', {
      id: ElementId,
      type: types.literal('ApolloWidget'),
      featureData: types.frozen(),
      view: types.safeReference(
        pluginManager.pluggableMstType('view', 'stateModel'),
      ),
      apolloUrl: types.string,
      apolloId: types.string,
    })
    .volatile(() => ({
      socket: undefined as any | undefined,
      // fetchedData: observable([{ main: {} }]) as any | undefined,
    }))
    .volatile(self => {
      const initialMap = new Map().set('main', {})
      initialMap.set(
        'features',
        // @ts-ignore
        getSession(self).connectionInstances[0].features,
      )
      return { fetchedData: observable.map(initialMap) as any | undefined }
    })
    .actions(self => ({
      setFeatureData(data: any) {
        self.featureData = data
      },
      clearFeatureData() {
        self.featureData = undefined
      },
      setSocket(socket: any) {
        self.socket = socket
      },
      addToFetchedData(data: any) {
        self.fetchedData.set(data.key, data.value)
      },
      async fetchFeatures() {
        const data = {
          username: sessionStorage.getItem(`${self.apolloId}-apolloUsername`), // get from renderProps later
          password: sessionStorage.getItem(`${self.apolloId}-apolloPassword`), // get from renderProps later
          sequence: self.featureData.sequence,
          organism: 'Fictitious', // need to find where in code is organism name
        }
        const featureResponse = await fetch(
          `${self.apolloUrl}/annotationEditor/getFeatures`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
          },
        )
        const json = await featureResponse.json()
        this.addToFetchedData({ key: 'features', value: json.features })

        // getting the parent feature, need client token
        // client token can be a random generated number for now
      },
      async fetchFeatureTree(additionalData?: any) {
        let data = {
          clientToken: sessionStorage.getItem(`clientToken`), // 20 digit random number for clientToken
          username: sessionStorage.getItem(`${self.apolloId}-apolloUsername`), // get from renderProps later
          password: sessionStorage.getItem(`${self.apolloId}-apolloPassword`), // get from renderProps later
          sequence: self.featureData.sequence,
          organism: 'Fictitious', // need to find where in code is organism name
        }
        if (additionalData) {
          data = { ...data, ...additionalData }
        }
        let params = Object.entries(data)
          .map(([key, val]) => `${key}=${encodeURIComponent(val)}`)
          .join('&')

        console.log(
          `${self.apolloUrl}/annotator/findAnnotationsForSequence/?${params}`,
        )

        return
        // dont fetch for now
        const featureResponse = await fetch(
          `${self.apolloUrl}/annotator/findAnnotationsForSequence/?${params}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          },
        )
        const json = await featureResponse.json()
        return json
      },
      // write actions that send fetch requests when something is edited
      // async afterCreate() {
      //   this.fetchFeatures()
      //   // TODO make a new tab with the response stuff
      // },
    }))
}

export { configSchema, stateModelFactory }
export { default as ReactComponent } from './ApolloFeatureDetail'
