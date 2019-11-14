import React from 'react';
import {
  View,
  ScrollView,
  Text,
  Animated,
  StyleSheet,
  Image,
  Easing,
  TouchableHighlight,
  Modal,
  FlatList,
} from 'react-native';
import { Button, Icon } from 'react-native-elements';
import { DrawerNavigator, NavigationActions, StackNavigator, TabNavigator } from 'react-navigation';

import { API, Storage } from 'aws-amplify';
import AddBusiness from './AddBusiness';
import UploadPhoto from '../Components/UploadPhoto';
import SideMenuIcon from '../Components/SideMenuIcon';
import awsmobile from '../aws-exports';
import { colors } from 'theme';
import Home from './Home';
import Ratings from './Rating';
import Search from './Search';
import RefineSearch from './RefineSearch';
import Notifications from './Notifications';

let styles = {};
var encodeUrl = require('encodeurl');

class Connections extends React.Component {
  constructor(props) {
    super(props);
   
    this.toggleModal = this.toggleModal.bind(this);
  }

  componentDidMount() {
    //this.getCurrentUser();
    this.getConnections();

  }

  state = {
    currentUser: {},
    allConnections: [], //Array of all users connection and their names
    unsortedConnections: [],
    modalVisible: false,
    ownerBusinesses: [],
  }

  // getCurrentUser = () => {
    // let returnedUser = {};
    // API.get('Businesses', '/items/user')
    // .then(apiResponse => {
      // returnedUser = apiResponse;
      // this.setState({ currentUser : returnedUser[0] });  //api returns an array, so [0] will pull out the object
      // console.log(this.state.currentUser);
    // })
    // .catch(err => alert('error getting current user...:'+err));
  // }

  getConnections(){
    //Variable to store the result of the query
    let allConnectionObjects = [];
    API.get('Businesses', '/items/getConnectionIds')
      .then(apiResponse => {
        allConnectionObjects = apiResponse;
        //store apiResponse in state
        this.setState({
           unsortedConnections: allConnectionObjects,
        });

      }).then(() => {
         this.SortConnections();
         })
      .catch(err => alert('error getting current connection objects...:'+err));
  }
  

  // animate() {
  //   Animated.loop(
  //     Animated.timing(
  //       this.animatedIcon,
  //       {
  //         toValue: 1,
  //         duration: 1300,
  //         easing: Easing.linear,
  //       }
  //     )
  //   ).start();
  // }


  openDrawer = () => {
    this.props.navigation.navigate('DrawerOpen');
  }

  //Sorts the array of connections to put the unrated connections first when outputting list.
  SortConnections(){
    let sortedConnections = [];
    let input = this.state.unsortedConnections;
    
    //loop through the unsortedConnections twice, first time push the unrated, 2nd push the rated
    for(let record of input){
      if(record.rated == false){
        sortedConnections.push(record);
      }
    }
    for(let record of input){
      if(record.rated == true){
        sortedConnections.push(record);
      }
    }
    //Store sorted array in state.
    this.setState({
      allConnections: sortedConnections,
    });
    console.log(this.state.allConnections);
  }
  
  // Encode(word){
     // let convertedWord = '';
     // for(let item of word){
        // if(item == ':'){
           // console.log("Found the colon");
           // item = '%3A';
        // }
        // convertedWord = convertedWord + item;
     // }
     // console.log(convertedWord);
  // }
  
  GetBusinessDetails(ownerId){
     
     let urlOwnerId = encodeURIComponent(ownerId);
     let path = "/items/businessRatings?ownerId=" + urlOwnerId;
     console.log(path);
     API.get('Businesses', path)
      .then(apiResponse => {
        //businessRatings = apiResponse;
        console.log(apiResponse);
        if(apiResponse.owner == false){
           throw new Error("Connection has no businesses");
        }
        else{
        this.setState({
           ownerBusinesses: apiResponse,
        });}
      }).then(() => {
         this.DisplayRatings();
         })
      .catch(err => alert('error getting owners business ratings...:'+err));

  }
  
  DisplayRatings = () => {
     console.log("displayRatings");
     this.toggleModal();
  }
  
 
  //For generating the list item when rendering the flatlist
  DisplayConnection = (item) => {
    //line templates 
  let line1 = <TouchableHighlight style={styles.ratingItemView} onPress={() => this.GetBusinessDetails(item.joinedUserId)}>
               <Text style={styles.ratingItemText}>{item.fullname} **</Text></TouchableHighlight>;
               
  let line2 = <TouchableHighlight style={styles.ratingItemView} onPress={() => this.GetBusinessDetails(item.joinedUserId)}>
                <Text style={styles.ratingItemText}>{item.fullname}</Text></TouchableHighlight>;
      
    if(item.rated === false){
      return line1;      
    }    
    else if(item.rated === true){
      return line2;
    }
    else{return "ERROR!";}
  }
  
  toggleModal() {
    // if (!this.state.modalVisible) {
   
    // }
    this.setState((state) => ({ modalVisible: !state.modalVisible }));
  }
  
  render() {
    return (
      <View style={[{ flex: 1 }]}>
        <ScrollView style={{ flex: 1 }}>
          <FlatList
            data={this.state.allConnections}
            extraData={this.state}
            keyExtractor={(item, index) => index}
            renderItem={({ item }) => (
              this.DisplayConnection(item)

            )}
          />

        </ScrollView>

        <Modal
          animationType={"slide"}
          transparent={false}
          visible={this.state.modalVisible}
          onRequestClose={this.toggleModal}
        >
          <Ratings businesses={this.state.ownerBusinesses} toggleModal={this.toggleModal} />
        </Modal>
      </View >
    );
  }
};

//So in the ratings screen we call this.props.screenProps.toggleModal to run this screens togMod function
//screenProps={{ handleRetrieveBusiness: this.handleRetrieveBusiness, toggleModal: this.toggleModal }}

styles = StyleSheet.create({
  container: {
    padding: 25,
  },
  breaker: {
    height: 1,
    backgroundColor: colors.darkGray,
    marginVertical: 1,
    width: '100%',
    marginBottom: 20,
  },
  title: {
    color: colors.darkGray,
    fontSize: 18,
    marginBottom: 15,
  },
  businessInfoContainer: {
    marginVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  businessInfoName: {
    color: colors.darkGray,
    fontSize: 20,
    marginLeft: 17
  },
  businessInfoAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  rightContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  title: {
    marginLeft: 20,
    marginTop: 19,
    color: colors.darkGray,
    fontSize: 18,
    marginBottom: 15,
  },
  trustindexnumber: {
    position: 'absolute',
    color: 'white',
    top: 25,
    left: 7,
  },
  ratingItemView: {
    borderWidth: 0.5,
    borderColor: '#d6d7da',
    height:70,
    backgroundColor: '#ededed',
    paddingTop: 20
  },
  ratingItemText: {
    marginLeft: 20,
    fontSize: 22,
    fontWeight: 'bold',
    color: 'black',

  },
})

const HomeRouteStack = {
  Connections: {
    screen: (props) => {
      const { screenProps, ...otherProps } = props;
      return <Connections {...props.screenProps} {...otherProps} />
    },
    navigationOptions: (props) => {
      return {
        title: 'Connections',
        headerLeft: <SideMenuIcon onPress={() => props.screenProps.rootNavigator.navigate('DrawerOpen')} />,
      }
    }
  },
};

const HomeNav = StackNavigator(HomeRouteStack,{ initialRouteName: 'Connections', headerMode: 'screen' });

export default (props) => {
  const { screenProps, rootNavigator, ...otherProps } = props;

  return <HomeNav screenProps={{ rootNavigator, ...screenProps, ...otherProps }} />
};
