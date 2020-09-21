/**
 *
 */
import React, { useState, useEffect, createRef, useContext } from 'react'
import { TextInput, ActivityIndicator } from 'react-native'
import {
  Container,
  Text,
  Screen,
  Constants,
  Button,
  Icon,
} from '@kancha/kancha-ui'
import { HeaderButtons, Item } from 'react-navigation-header-buttons'
import { NavigationStackScreenProps } from 'react-navigation-stack'
import { Colors } from '../../theme'
import { useTranslation } from 'react-i18next'
import { TouchableHighlight } from 'react-native-gesture-handler'
import { Identity } from '@kancha/kancha-ui/dist/types'
import hexToRgba from 'hex-to-rgba'
import { issueCredential, getIdentitiesWithProfiles } from '../../services/daf'
import { agent } from '../../services/daf'
import useAgent from '../../hooks/useAgent'

interface Field {
  type: string
  value: any
}

const IssueCredential: React.FC<NavigationStackScreenProps> & {
  navigationOptions: any
} = ({ navigation }) => {
  const { t } = useTranslation()
  const viewer = navigation.getParam('viewer')
  const getCredentials = navigation.getParam('getCredentials')
  const [claimType, setClaimType] = useState('')
  const [claimValue, setClaimValue] = useState('')
  const [errorMessage, setErrorMessage] = useState<any>()
  const [sending, setSending] = useState(false)
  const [subject, setSubject] = useState(viewer)
  const [fields, updateFields] = useState<Field[]>([])
  const [identitySelectOpen, setIdentitySelect] = useState(false)

  const { state: allIdentities, loading } = useAgent(getIdentitiesWithProfiles)

  const inputSubject = (did: string) => {
    /**
     * If the user pastes in a did that is already in our known
     * identities then we use that entry as it may have additional data associated
     */
    const matchedIdentity =
      allIdentities.data &&
      allIdentities.data.find((identity: Identity) => identity.did === did)
    if (matchedIdentity) {
      setSubject(matchedIdentity)
    } else {
      const sub = {
        did,
        shortId: 'an unknown did',
      }
      setSubject(sub)
    }
  }

  const updateClaimFields = (field: Field) => {
    const claimTypes = fields.map((field: Field) => field.type)
    const newfields = fields.concat([field])
    setErrorMessage(null)

    if (!field.type) {
      setErrorMessage(t('Enter claim type'))
      return
    }

    if (!field.value) {
      setErrorMessage(t('Enter claim value'))
      return
    }

    if (claimTypes.includes(field.type)) {
      setErrorMessage(t('Claim type already exists'))
      return
    }

    updateFields(newfields)
    setClaimValue('')
    setClaimType('')
  }

  const openIdentitySelection = () => {
    setIdentitySelect(true)
    // getKnownIdentities()
  }

  const removeClaimField = (index: number) => {
    const updatedClaims = fields.filter((item: any, i: number) => i !== index)
    updateFields(updatedClaims)
  }

  const signVc = async () => {
    const credential = await issueCredential(viewer.did, viewer.did, fields)
    await agent.handleMessage({ raw: credential.proof.jwt, save: true })
    await getCredentials()
    navigation.dismiss()
  }

  return (
    <Screen scrollEnabled background={'primary'}>
      <Container padding>
        <Text type={Constants.TextTypes.H2} bold>
          {t('Issue Credential')}
        </Text>
        <Container marginTop={10}>
          <Text type={Constants.TextTypes.Body}>
            {t('You are issuing a credential to')}{' '}
            <Text>
              {viewer.did === subject.did ? t('yourself') : subject.shortId}
            </Text>
          </Text>
          {!subject.did && (
            <Text warn type={Constants.TextTypes.Body}>
              {t('You must enter a subject identity')}
            </Text>
          )}
        </Container>
        <Container
          backgroundColor={
            subject.did
              ? hexToRgba(Colors.CONFIRM, 0.3)
              : hexToRgba(Colors.WARN, 0.3)
          }
          padding
          br={5}
          marginTop
          marginBottom
        >
          <Container
            flexDirection={'row'}
            alignItems={'center'}
            justifyContent={'space-between'}
          >
            <Container flex={1}>
              <TextInput
                autoCapitalize={'none'}
                autoCompleteType={'off'}
                autoCorrect={false}
                onFocus={() => openIdentitySelection()}
                onBlur={() => setIdentitySelect(false)}
                clearButtonMode={'always'}
                style={{ fontFamily: 'menlo', color: Colors.CHARCOAL }}
                onChangeText={inputSubject}
              >
                {subject.did}
              </TextInput>
            </Container>
          </Container>
          {identitySelectOpen && (
            <Container marginTop>
              {loading && (
                <Container
                  flexDirection={'row'}
                  alignItems={'center'}
                  paddingTop
                >
                  <ActivityIndicator />
                  <Container marginLeft>
                    <Text>Loading known identities..</Text>
                  </Container>
                </Container>
              )}
              <Container>
                <TouchableHighlight
                  onPress={() => setSubject(viewer)}
                  underlayColor={
                    subject.did
                      ? hexToRgba(Colors.CONFIRM, 0.4)
                      : hexToRgba(Colors.WARN, 0.4)
                  }
                  style={{ padding: 10, borderRadius: 5 }}
                >
                  <Container>
                    <Text textStyle={{ fontFamily: 'menlo' }}>
                      {viewer.shortId} (you)
                    </Text>
                  </Container>
                </TouchableHighlight>
                {allIdentities.data &&
                  allIdentities.data
                    .filter((i: Identity) => i.did !== viewer.did)
                    .map((identity: any) => {
                      return (
                        <TouchableHighlight
                          key={identity.did}
                          onPress={() => setSubject(identity)}
                          underlayColor={Colors.CONFIRM}
                          style={{ padding: 10, borderRadius: 5 }}
                        >
                          <Container>
                            <Text textStyle={{ fontFamily: 'menlo' }}>
                              {identity.shortId}
                            </Text>
                          </Container>
                        </TouchableHighlight>
                      )
                    })}
              </Container>
            </Container>
          )}
        </Container>

        <Container background={'secondary'} padding marginBottom br={5}>
          {fields.length === 0 && <Text>{t('No claims added yet')}</Text>}
          {fields.map((field: Field, index: number) => {
            return (
              <Container
                key={field.type + index}
                paddingBottom={5}
                flexDirection={'row'}
                alignItems={'center'}
              >
                <Container>
                  <Text textStyle={{ fontFamily: 'menlo' }}>
                    <Text type={Constants.TextTypes.SubTitle}>
                      {field.type}:
                    </Text>{' '}
                    {field.value}
                  </Text>
                </Container>
                <Container marginLeft>
                  <Button
                    iconButton
                    small
                    icon={
                      <Icon
                        size={16}
                        color={Colors.WARN}
                        icon={{
                          name: 'ios-remove-circle',
                          iconFamily: 'Ionicons',
                        }}
                      />
                    }
                    onPress={() => removeClaimField(index)}
                  />
                </Container>
              </Container>
            )
          })}
        </Container>
        <Container
          background={'primary'}
          padding
          br={5}
          marginBottom
          dividerBottom
        >
          <TextInput
            value={claimType}
            onChangeText={setClaimType}
            placeholder={t('Enter claim type')}
            autoCorrect={false}
            autoCapitalize={'none'}
            autoCompleteType={'off'}
            style={{ color: Colors.CHARCOAL }}
            placeholderTextColor={Colors.LIGHT_GREY}
          />
        </Container>
        <Container background={'primary'} padding br={5} dividerBottom>
          <TextInput
            value={claimValue}
            onChangeText={setClaimValue}
            placeholder={t('Enter claim value')}
            autoCorrect={false}
            autoCapitalize={'none'}
            autoCompleteType={'off'}
            style={{ color: Colors.CHARCOAL }}
            placeholderTextColor={Colors.LIGHT_GREY}
          />
        </Container>
        <Container padding alignItems={'flex-start'}>
          <Button
            iconButton
            buttonText={'Add claim'}
            icon={
              <Icon
                color={Colors.CONFIRM}
                icon={{ name: 'ios-add-circle', iconFamily: 'Ionicons' }}
              />
            }
            onPress={() =>
              updateClaimFields({ type: claimType, value: claimValue })
            }
          />
        </Container>
        <Container alignItems={'center'}>
          {errorMessage && <Text warn>{errorMessage}</Text>}
          {sending && (
            <Container flexDirection={'row'}>
              <Container marginRight>
                <ActivityIndicator />
              </Container>
              <Text>{sending && t('Issuing credential...')}</Text>
            </Container>
          )}
        </Container>
        <Container marginTop={20}>
          <Container>
            <Button
              fullWidth
              disabled={sending || fields.length === 0 || !subject.did}
              block={Constants.ButtonBlocks.Filled}
              type={Constants.BrandOptions.Primary}
              buttonText={'Issue'}
              onPress={() => signVc()}
            />
          </Container>
        </Container>
      </Container>
    </Screen>
  )
}

IssueCredential.navigationOptions = ({ navigation }: any) => {
  return {
    title: 'Issue credential',
    headerLeft: () => (
      <HeaderButtons>
        <Item title={'Cancel'} onPress={navigation.dismiss} />
      </HeaderButtons>
    ),
  }
}

export default IssueCredential
