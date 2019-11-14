/*
 * Copyright 2017-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with
 * the License. A copy of the License is located at
 *
 *     http://aws.amazon.com/apache2.0/
 *
 * or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
 * CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions
 * and limitations under the License.
 */
import React from 'react';
import {
  View,
  Text,
  CameraRoll,
  StyleSheet,
  TouchableWithoutFeedback,
  Modal,
  Dimensions,
  Image,
  ScrollView,
  ImageStore,
  Platform,
  ActivityIndicator,
  Picker,
  FlatList,
} from 'react-native';
import {
  FormLabel,
  FormInput,
  FormValidationMessage,
  Button,
  Icon,
  ButtonGroup,
  CheckBox,
} from 'react-native-elements';
import { DrawerNavigator, NavigationActions, StackNavigator } from 'react-navigation';
import RNFetchBlob from 'react-native-fetch-blob';
import uuid from 'react-native-uuid';
import mime from 'mime-types';
import SideMenuIcon from '../Components/SideMenuIcon';
import Home from './Home';

import { colors } from 'theme';
import { API, Storage } from 'aws-amplify';
import files from '../Utils/files';
import awsmobile from '../aws-exports';
import DatePicker from '../Components/DatePicker';


const { width, height } = Dimensions.get('window');


let styles = {};

class InviteContacts extends React.Component {

  static navigationOptions = {
    title: 'Invite Contacts',  //The title bar at the top of the screen
  }

  constructor(props){
    super(props);
  }

  componentWillMount(){
    console.log("willMount");

  }
  componentDidMount(){
    //this.getCurrentUser();
    this.initialiseContacts();
  }

  state = {
    loading: true,
    //Holds the array of the current user profile.
    currentUser: {},
    modalVisible: false,
    showActivityIndicator: false,
    //Hold all the contacts from the phone
    contacts: [],
    //Holds the checked items in the displayed contacts list
    checked: [],
    //All items in the inviteConnections table for the current user.
    userInvites: [],
    //Users Converted invites
    userConverts: [],
    //Hold the contacts after checking user invites (adds found = true to invites which are found)
    finalisedContacts: [],

  }

/*  getCurrentUser = () => {
    let returnedUser = {};
    API.get('Businesses', '/items/user')
    .then(apiResponse => {
      returnedUser = apiResponse;
      this.setState({ currentUser : returnedUser[0] });  //api returns an array, so [0] will pull out the object
      console.log(this.state.currentUser);
    })
    .catch(err => alert('error getting current user...:'+err));
    //this.setState({ currentUser : returnedUser });
  }*/


  initialiseContacts() {
    this.retrieveContacts();
    this.getUserInvites();
  }


  //Retrieves contacts and puts them in state contacts
  retrieveContacts(){
      //Empty array to hold results
      let contactList = [];
      //Get contacts list from phone
      let getContacts = require('react-native-contacts');
      getContacts.getAll((err, contacts) => {
        if(err) throw err;
        contactList = contacts;
        //Check result has been put into contactList
        //console.log(contactList); //Works! Object in Console
        //Assign contactList to state variable contacts
        for(let contact of contactList){
           contact.phoneNumbers[0].number = contact.phoneNumbers[0].number.replace(/\s/g, '');
        }
        this.setState({
          contacts: contactList,
        })
      })
    }

    //API get list of all users invite records in DDB invitedConnectionsTable
  getUserInvites(){

    //API call
    API.get('Businesses', '/items/inviteConnections')
    .then(apiResponse => {
      //console.log(apiResponse);
      this.setState({
        userInvites: apiResponse,  //Place results in state
      });
      //console.log(this.state.userInvites); //Full
    })
    .then(() => {
      //Call convertContacts to set found property if invite exists
      this.convertContacts();
      //this.getUserConverts();  //Used with below to capture converted.
    })
    .catch(err => alert('error getting current user invites...:'+err));
  }

  //USE LATER IF NEEDING TO DISTINGUISH INVITES AND CONVERTS
  // getUserConverts = () => {
  //   //Create variable and get value from state
  //   let fullList = this.state.userInvites;

  //   let convertedUsers = [];
  //   //loop through fullList array and log each item.
  //   fullList.map((item) => {
  //       if (typeof item.joinedUserId !== "undefined") {
  //         this.state.userConverts.push(item.invitedMobile);
  //       }
  //   });
  //   //this.convertContacts(); //Change this, it is being used below, needs a new name and func.
  //    //can use similar settup to the function below for this^
  // }

  //Create an array of all contacts which identifies existing invites
  convertContacts = () => {
    
    //Variables to hold contacts array, invites array, and the finalised contacts after comparing.
    let finalised = [];
    let contacts = this.state.contacts;
    let invites = this.state.userInvites;

    for (let cont of contacts){

      //Compare contacts to the mobile numbers in the userInvites array
      for (let i = 0; i < invites.length; i++){
        if(cont.phoneNumbers[0].number == invites[i].invitedMobile){
          console.log(cont.givenName + " is in invites");
          //add found field to the found cont
          cont["found"] = true;
        }
      }
      //Add each contact to the finalised array
      finalised.push(cont);
    }

    //Store finalised contacts in state
    this.setState({
      finalisedContacts: finalised,
    });
    console.log(finalised);
  }

  updateInput = (key, value) => {
    this.setState((state) => ({
      input: {
        ...state.input,
        [key]: value,
      }
    }))
  }

  toggleModal = () => {
    this.setState(() => ({ modalVisible: !this.state.modalVisible }))
  }


sendInvites = async () => {
    //Array to hold the inviteMobiles
    let data = [];

    alert("Invites Sending...");
   
 
    for(let contact of this.state.checked) {
      //create an object for the inviteMobile, 'userId' and 'rated' fields are added at backend
      let inviteObject = {
        invitedMobile: contact.phoneNumbers[0].number,
        invitedName: contact.givenName,
      }
      //Push inviteObject onto data array
      data.push(inviteObject);
      /*
      let params = {
          method: 'POST',
          headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({
              'from': contact.firstName + " " + contact.familyName,
              'to': contact.phoneNumbers[0].number,
              'text': 'Hi '+contact.firstName+', I am using ReferMe2 for business referrals and thought you might want to also join up at http://referme2.com.au/join Cheers Fred',
          })
      }
      fetch("https://cfyz0i2kk6.execute-api.us-west-2.amazonaws.com/prod/sms-async", params)
        .then((data) => {
          let x = 1;
        })
        .catch(err => {
          alert('error sending invites...', err);
          console.log('error sending invites...', err);
        }); */
    }
    //Array holding the invite objects. Send this to the API.
    this.apiSaveInvites(data);  //Calls function below
  }

  //Put the array of new invite objects into ddb.
  async apiSaveInvites(invites){
    return await API.post('Businesses', '/items/saveInvites', { body: invites });
  }
  
  checkItem = item => {
    const { checked } = this.state;

    if (!checked.includes(item)) {
      this.setState({ checked: [...checked, item] });
    } else {
      this.setState({ checked: checked.filter(a => a !== item) });
    }
  };

  //When outputting the list this is the code for a checkbox item
  checkBox = item => {
      //console.log(item);
    let line = <View style={styles.listView}><CheckBox style={styles.checkboxes} containerStyle={styles.checkboxContainer}
        checkedColor={colors.primary}
        title={item.givenName + " " + item.familyName}
        textStyle={styles.greenCheck}
        onPress={() => this.checkItem(item)}
        checked={this.state.checked.includes(item)}
      /></View>;
    if(item.found == true)  {
      //If already found then print the green check instead of the checkbox
      return this.checkGreen(item);
    }
    else {
      return line;
    }
  }
  //This is the code for a converted green check item
  checkGreen = item => {
    let line = <View style={styles.listView}><Text style={styles.greenCheck} containerStyle={styles.greenCheckContainer}>
      <Image source={require('../../assets/images/green_check.png')}
      style={{width:60, height: 60}}/>    {item.givenName} {item.familyName}</Text></View>
    return line;
  }

  //Function runs when Select all button is pressed
  SelectAll = () => {
    console.log("Select All function ran");
    let checkedList = this.state.checked;
    let contacts = this.state.finalisedContacts;

    //If record from finalisedContacts is not in state.checked then push it to checkedList
    for (let item of contacts){
      if(item.found == undefined){
        if(!checkedList.includes(item)){
          checkedList.push(item);
        }
      }
    }
    console.log(checkedList);
    //Set checkedList(updated List all checked) to the state: checked.
    this.setState({
      checked: checkedList,
    }) 
  }

  //Function runs when Clear selection button is pressed, clears the checked state array
  SelectNone = () => {
    let checkedList = this.state.checked;
    let contacts = this.state.finalisedContacts;

    //If record from finalised contacts is in checkedList, then filter checkedList( drop item)
    for (let item of contacts){
      if(checkedList.includes(item)){
        checkedList = checkedList.filter(a => a !== item); 
      }
    }
    //After the checkList has been cleared by the for loop above, now assign the empty array to state: checked
    this.setState({
      checked: checkedList,
    })
  }


  render() {

    return (
      <View style={{ flex: 1, paddingBottom: 0 }}>
        
        <ScrollView style={{ flex: 1 }}>
          <Text style={styles.title}>Invite Contacts</Text>
          <Button 
            fontFamily='lato'
            containerViewStyle={{ marginTop: 20 }}
            backgroundColor={colors.primary}
            large
            title="Select All"
            onPress={this.SelectAll}
          />
          <Button
            fontFamily='lato'
            containerViewStyle={{ marginTop: 20 }}
            backgroundColor={colors.primary}
            large
            title="Clear Selected"
            onPress={this.SelectNone}
          />
          <FlatList
            data={this.state.finalisedContacts}
            extraData={this.state}
            keyExtractor={(item, index) => index}
            renderItem={({ item }) => (
              this.checkBox(item)

            )}
          />
          <Button
            fontFamily='lato'
            containerViewStyle={{ marginTop: 20 }}
            backgroundColor={colors.primary}
            large
            title="Send Invites"
            onPress={this.sendInvites}
          />
          <Text
            onPress={() => this.props.rootNavigator.navigate('Home')}
            style={styles.closeModal}>Cancel</Text>

        </ScrollView>
        <Modal
          visible={this.state.showActivityIndicator}
          onRequestClose={() => null}
        >
          <ActivityIndicator
            style={styles.activityIndicator}
            size="large"
          />
        </Modal>
      </View>
    );
  }      //close render
}       //close class

styles = StyleSheet.create({
  buttonGroupContainer: {
    marginHorizontal: 8,
  },
  addImageContainer: {
    width: 120,
    height: 120,
    backgroundColor: colors.lightGray,
    borderColor: colors.mediumGray,
    borderWidth: 1.5,
    marginVertical: 14,
    borderRadius: 60,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageTitle: {
    color: colors.darkGray,
    marginTop: 3,
  },
  closeModal: {
    color: colors.darkGray,
    marginTop: 10,
    marginBottom: 10,
    textAlign: 'center',
  },
  title: {
    marginLeft: 20,
    marginTop: 19,
    color: colors.darkGray,
    fontSize: 18,
    marginBottom: 15,
  },
  input: {
    fontFamily: 'lato',
  },
  activityIndicator: {
    backgroundColor: colors.mask,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  picker: {
    marginLeft: 10,
  },
  pickerTextStyle: {
    fontFamily: 'lato',
    fontSize: 8,
  },
  checkboxes: {
    marginLeft: 20,

  },
  checkboxContainer: {
    borderWidth: 0,
  },
  greenCheck: {
    marginLeft: 20,
    fontSize: 22,
    fontWeight: 'bold',
    color: 'black',

  },
  greenCheckContainer: {
    borderWidth: 0,
  },
  listView: {
    borderWidth: 0.5,
    borderColor: '#d6d7da',
    height:70,
    backgroundColor: '#ededed',
    paddingTop: 20
  }
});


const HomeRouteStack = {
  Home: {
    screen: (props) => {
      const { screenProps, ...otherProps } = props;
      return <Home {...props.screenProps} {...otherProps} />
    },
    navigationOptions: (props) => {
      return {
        title: 'Profile',
        headerLeft: <SideMenuIcon onPress={() => props.screenProps.rootNavigator.navigate('DrawerOpen')} />,
      }
    }
  },
  InviteContacts: {
    screen: (props) => {
      const { screenProps, ...otherProps } = props;
      return <InviteContacts {...props.screenProps} {...otherProps} />
    },
    navigationOptions: (props) => {
      return {
        title: 'Invite Contacts',
        headerLeft: <SideMenuIcon onPress={() => props.screenProps.rootNavigator.navigate('DrawerOpen')} />,
      }
    }
  },
};

const HomeNav = StackNavigator(HomeRouteStack,{ initialRouteName: 'InviteContacts', headerMode: 'screen' });

export default (props) => {
  const { screenProps, rootNavigator, ...otherProps } = props;

  return <HomeNav screenProps={{ rootNavigator, ...screenProps, ...otherProps }} />
};
