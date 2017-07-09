import pandas as pd
import os.path

df = pd.read_csv('../DataVisualization_project/internet_users_per100_original.csv')

### set the index of df to be the countries:
df.set_index('country', inplace=True)

### drop rows that contain all NaN values
df = df.dropna(axis = 'index', how = 'all')

### write dataframe to a csv file
df.to_csv('../DataVisualization_project/internet_users_per100_overwrite.csv')

### after imputing some data in the previous file, save the new file below
imputed_file = '../DataVisualization_project/internet_users_per100_imputed.csv'

if os.path.isfile(imputed_file):

	### load new csv file after imputing the previous one
	df = pd.read_csv(imputed_file)

	### make the remaining NaN values zero
	df = df.fillna(0)

	### make the country, year, and internet_subscriptions variables into their own columns (ie. make the dataset 'tidy')
	tidy_df = pd.melt(df, ['country'], var_name = 'year', value_name = 'internet_subscriptions_per100_people')

	### sort the dataframe by country and year
	tidy_df = tidy_df.sort_values(by = ['country', 'year']) 

	### reset the index column then delete it
	tidy_df.reset_index(level = 0, inplace = True)
	del tidy_df['index']

	### write tidy_df to a new csv file
	tidy_df.to_csv('../DataVisualization_project/internet_users_per100_tidy.csv')