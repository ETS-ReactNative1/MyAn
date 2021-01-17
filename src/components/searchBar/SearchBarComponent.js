import React, { useState, useEffect, useCallback } from 'react';
import { SafeAreaView, View, StyleSheet, Alert, Text } from 'react-native';
import { Searchbar, ActivityIndicator } from 'react-native-paper';
import { OptimizedFlatList } from 'react-native-optimized-flatlist';
import { useNetInfo } from "@react-native-community/netinfo";
import axios from 'axios';

import DescriptionAnime from '../descriptionAnime/DescriptionAnime';
import useResults from '../../hooks/useResults';
import getRealm from '../../services/realm';
import { apiListAnime, jikanRepository } from '../../services/consts';

const SearchbarComponent = () => {
  
	const netInfo = useNetInfo();
	const [search, setSearch] = useState('');
	const [filteredDataSource, setFilteredDataSource] = useState([]);
	const [masterDataSource, setMasterDataSource] = useState([]);
	const [loading, setLoading] = useState(false);
	const [searchSeasonAnimeApi, results, errorMessage] = useResults();

	useEffect(() => {
		async function syncListAnime() {
			const realm = await getRealm();
			const animes = realm.objects(jikanRepository);
			console.log(animes.length)

			if(netInfo.type == 'wifi' && animes.length == 0) {
				await getListAnime();
				setFilteredDataSource(results);
				setMasterDataSource(results);
				setLoading(false);
			} else {
				const response = realm.objects(jikanRepository);
				setFilteredDataSource(response);
				setMasterDataSource(response);
			} 
		}
		syncListAnime();
	}, []);

	async function getListAnime() {
		try {
			setLoading(true);
			const response = await axios.get(apiListAnime);
			await saveListAnime(response.data.anime);
		} catch(err) {
			console.log(err)
			setLoading(false);
		}
	}

	async function saveListAnime(animes) {
		const data = {};
		const realm = await getRealm();
		
		for(let aux = 0; aux < animes.length; aux ++) {
			if(animes[aux].episodes === null) {
				animes[aux].episodes = 0;
			}
			data['mal_id'] = animes[aux].mal_id;
			data['title'] = animes[aux].title;
			data['image_url'] = animes[aux].image_url;
			data['synopsis'] = animes[aux].synopsis;
			data['episodes'] = animes[aux].episodes;

			realm.write(() => {
				realm.create(jikanRepository, data, 'modified');
			});
		}
	}

	const searchFilterFunction = (text) => {
		if (text) {
			const newData = masterDataSource.filter(
				function (item) {
					const itemData = item.title ? item.title.toUpperCase() : ''.toUpperCase();
					const textData = text.toUpperCase();
					return itemData.indexOf(textData) > -1;
				}
			);
			setFilteredDataSource(newData);
			setSearch(text);
		} else {
			setFilteredDataSource(masterDataSource);
			setSearch(text);
		}
	};

	const renderFooter = () => {
		if (!loading) {
			return null;
		} 
		
		return (
			<View style = { styles.loading }>
				<ActivityIndicator />
		  	</View>
		);
	};

	const renderItem = useCallback(({ item }) =>
		<DescriptionAnime item = { item } />
	,[]);

	const keyExtractor = useCallback((item) => item.mal_id.toString(), []);

	return(
		<SafeAreaView style = {{ flex: 1 }}>
			<View style = { styles.container }>
				<Searchbar
					placeholder = 'Procure Aqui '
					onChangeText={(text) => searchFilterFunction(text)}
					value = { search }
				/>
				{
					loading == true ? (
						<View style = { styles.loading }>
							<ActivityIndicator />
						</View>
					) : (
						<OptimizedFlatList
							data = { filteredDataSource }
							keyExtractor = { keyExtractor }
							maxToRenderPerBatch = { 20 }
							onEndReachedThreshold = { 0.2 }
							ListFooterComponent={ renderFooter }
							renderItem = { renderItem }
							numColumns = { 2 }
						/> 
					)
				}

			</View>
		</SafeAreaView>
	);
}

const styles =  StyleSheet.create({
    
    container: {
        backgroundColor: 'white',
    },
    itemStyle: {
        padding: 10,
    },
    textInputStyle: {
        height: 40,
        borderWidth: 1,
        paddingLeft: 20,
        margin: 5,
        borderColor: '#009688',
        backgroundColor: '#FFFFFF',
    },
    loading: {
		top: 240
    },
    textLoading: {
        fontSize: 20,
        textAlign: 'center',
        marginBottom: -20,
        top: 10
    }
});

export default SearchbarComponent;