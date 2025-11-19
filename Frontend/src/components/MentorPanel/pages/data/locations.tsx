import React, { useState, useEffect } from 'react';
import {
  TextField,
  Autocomplete,
  Chip,
  Box,
  Typography,
  Paper
} from '@mui/material';
import { searchCities } from './locationData';

const LocationInput = ({ value = [], onChange, label = "Location", placeholder = "Type city name..." }) => {
  const [inputValue, setInputValue] = useState('');
  const [options, setOptions] = useState([]);

  useEffect(() => {
    if (inputValue.length > 0) {
      const searchResults = searchCities(inputValue);
      setOptions(searchResults);
    } else {
      setOptions([]);
    }
  }, [inputValue]);

  const handleChange = (event, newValue) => {
    onChange(newValue);
  };

  const renderOption = (props, option) => (
    <Box component="li" {...props} key={option.name}>
      <Box>
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {option.name}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {option.state} • Tier {option.tier}
        </Typography>
      </Box>
    </Box>
  );

  const renderTags = (tagValue, getTagProps) =>
    tagValue.map((option, index) => (
      <Chip
        {...getTagProps({ index })}
        key={option.name}
        label={`${option.name}, ${option.state}`}
        size="small"
        color="primary"
        variant="outlined"
      />
    ));

  return (
    <Autocomplete
      multiple
      value={value}
      onChange={handleChange}
      inputValue={inputValue}
      onInputChange={(event, newInputValue) => {
        setInputValue(newInputValue);
      }}
      options={options}
      getOptionLabel={(option) => `${option.name}, ${option.state}`}
      isOptionEqualToValue={(option, value) => option.name === value.name && option.state === value.state}
      renderOption={renderOption}
      renderTags={renderTags}
      PaperComponent={({ children, ...other }) => (
        <Paper {...other} sx={{ maxHeight: 200, overflow: 'auto' }}>
          {children}
        </Paper>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={value.length === 0 ? placeholder : ""}
          variant="outlined"
          fullWidth
          helperText="Select multiple cities from Tier 1, 2, and 3 Indian cities"
        />
      )}
      sx={{
        '& .MuiAutocomplete-tag': {
          margin: '2px',
        },
        '& .MuiAutocomplete-inputRoot': {
          paddingTop: value.length > 0 ? '8px' : '0px',
        }
      }}
    />
  );
};

export default LocationInput;