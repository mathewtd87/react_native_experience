/*

 */
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
import { DrawerNavigator, NavigationActions, StackNavigator } from 'react-navigation';

import { API, Storage } from 'aws-amplify';
import AddBusiness from './AddBusiness';
import UploadPhoto from '../Components/UploadPhoto';
import SideMenuIcon from '../Components/SideMenuIcon';
import awsmobile from '../aws-exports';
import { colors } from 'theme';
import Stars from 'react-native-stars-rating';

let styles = {};

class Ratings extends React.Component {
  
  constructor(props) {
    super(props);
  }

  componentDidMount() {
      this.InitBusinesses();
     
  }

  state = {
     businesses: [],
  }
  
  InitBusinesses =() => {
     this.setState({
        businesses : this.props.businesses,
     });
     console.log(this.props.businesses);
     
     this.SetRated(this.props.businesses);
  }
  
  SetRated = (businesses) => {
     let id = businesses[0].userId
     let setRatedId = {
        ownerId: id,
     };
     console.log(setRatedId);
     // console.log("Sent to affirm rated is " + setRated.ownerId);
     API.post('Businesses', '/items/setRated', {body: setRatedId})
      .then(apiResponse => {
        console.log(apiResponse);
      })
      .catch(err => alert('error during setRated...:'+err));
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


  doSave = (ratingObject) => {
    
    API.post('Businesses', '/items/saveRating', { body: ratingObject })
      .then((apiResponse) => console.log(apiResponse))
      .catch(err => {
        console.log('error saving rating...', err);
      });
      return;
  }
  saveRating = (rating, id, owner) => {
     let ratingObject = {
        businessId: id,
        starRating: rating,
        ownerId: owner,
     };
     this.doSave(ratingObject);     
  }
  
  ratingOption(business) {
     
    
    return (
      <TouchableHighlight //style={{backgroundColor: "green"}}
        underlayColor='transparent'
        key={business.businessid}
      >
        <View style={styles.businessInfoContainer}>
           <View style={styles.businessInfoName}>
               <Text style={styles.businessName}>{business.name}</Text>
           </View>
          <View style={styles.starContainer}>
            <Stars
              isActive={true}
              rateMax={5}
              isHalfStarEnabled={false}
              onStarPress={(rating) => {this.saveRating(rating, business.businessId, business.userId)}}
              rate={business.starRating != undefined ? business.starRating : 0}
              size={60}
            // <Rating
              // type='custom'
              // showRating
              // startingValue={business.starRating != undefined ? business.starRating : 0}
              // onFinishRating={(rating) => {this.saveRating(rating, business.businessId)}}
              // imageSize={60}
              // ratingBackgroundColor='#e3e3e3'
              // style={{backgroundColor:'#e3e3e3'}}
            />
          </View>
        </View>
      </TouchableHighlight>
    )
  }

  render() {
    
    const businessobjects = this.state.businesses;

    return (
      <View style={[{ flex: 1 }]}>
        <ScrollView>
          <FlatList
            data={businessobjects}
            extraData={this.state}
            keyExtractor={(item, index) => index}
            renderItem={({ item }) => (
              this.ratingOption(item)

            )}
          />
      
        </ScrollView>
        <Text
            onPress={this.props.toggleModal}
            style={styles.closeModal}>Back to Connections</Text>
      </View >
    );
  }
};

styles = StyleSheet.create({
   closeModal: {
    color: colors.darkGray,
    marginTop: 10,
    marginBottom: 10,
    textAlign: 'center',
    fontSize: 20,
  },
  container: {
    padding: 15,
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
    marginBottom: 1,
  },
  businessInfoContainer: {
    marginTop: 10,
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingBottom: 10,
    
  },
  businessNameView: {
    marginLeft: 17,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    padding: 20,
  },
  businessName: {
    color: colors.darkGray,
    fontSize: 30,
    marginLeft: 17,
    alignItems: 'center',
    padding: 10,
  },
  businessInfoAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  starContainer: {
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 10,
    //marginTop: 50,
  },
})

//export default Rating;

const RatingRouteStack = {
  Rating: {
    screen: (props) => {
      const { screenProps, ...otherProps } = props;
      return <Ratings {...props.screenProps} {...otherProps} />
    },
    navigationOptions: { header: null },
  }
};

const RatingNav = StackNavigator(RatingRouteStack);

export default (props) => {
  const { screenProps, rootNavigator, ...otherProps } = props;

  return <RatingNav screenProps={{ rootNavigator, ...screenProps, ...otherProps }} />
};
