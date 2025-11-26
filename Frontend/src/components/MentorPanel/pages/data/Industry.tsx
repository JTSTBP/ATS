// // import React, { useState, useEffect } from "react";
// // import {
// //   FormControl,
// //   Chip,
// //   Box,
// //   TextField,
// //   Paper,
// //   List,
// //   ListItem,
// //   ListItemText,
// //   Typography,
// // } from "@mui/material";
// // import { searchIndustries } from "./locationData";

// // const IndustryInput = ({
// //   value = "",
// //   onChange,
// //   label = "Industry",
// //   required = false,
// // }) => {
// //   const [searchTerm, setSearchTerm] = useState("");
// //   const [filteredIndustries, setFilteredIndustries] = useState([]);
// //   const [isOpen, setIsOpen] = useState(false);

// //   useEffect(() => {
// //     if (searchTerm.length > 0) {
// //       const results = searchIndustries(searchTerm);
// //       setFilteredIndustries(results);
// //     } else {
// //       setFilteredIndustries([]);
// //     }
// //   }, [searchTerm]);

// //   const handleSearchChange = (event) => {
// //     setSearchTerm(event.target.value);
// //     setIsOpen(true);
// //   };

// //   const handleIndustrySelect = (industry) => {
// //     onChange(industry); // ✅ single selection
// //     setSearchTerm("");
// //     setFilteredIndustries([]);
// //     setIsOpen(false);
// //   };

// //   return (
// //     <Box sx={{ position: "relative", width: "100%" }}>
// //       <FormControl fullWidth required={required}>
// //         {value && (
// //           <Chip
// //             label={value}
// //             onDelete={() => onChange("")}
// //             size="small"
// //             sx={{ mb: 1 }}
// //             color="primary"
// //             variant="outlined"
// //           />
// //         )}

// //         <TextField
// //           value={searchTerm}
// //           onChange={handleSearchChange}
// //           onFocus={() => setIsOpen(true)}
// //           placeholder={
// //             value ? "Change industry..." : "Type to search industries..."
// //           }
// //           variant="outlined"
// //           size="small"
// //           sx={{ mt: value ? 1 : 0 }}
// //         />
// //       </FormControl>

// //       {isOpen && filteredIndustries.length > 0 && (
// //         <Paper
// //           sx={{
// //             position: "absolute",
// //             top: "100%",
// //             left: 0,
// //             right: 0,
// //             zIndex: 1300,
// //             maxHeight: 200,
// //             overflow: "auto",
// //             mt: 0.5,
// //           }}
// //           elevation={3}
// //         >
// //           <List dense>
// //             {filteredIndustries.map((industry, index) => (
// //               <ListItem
// //                 key={index}
// //                 button
// //                 onClick={() => handleIndustrySelect(industry)}
// //                 disabled={value === industry}
// //                 sx={{
// //                   "&:hover": {
// //                     backgroundColor: "action.hover",
// //                   },
// //                   opacity: value === industry ? 0.5 : 1,
// //                 }}
// //               >
// //                 <ListItemText
// //                   primary={industry}
// //                   secondary={value === industry ? "Selected" : null}
// //                 />
// //               </ListItem>
// //             ))}
// //           </List>
// //         </Paper>
// //       )}

// //       {isOpen && searchTerm.length > 0 && filteredIndustries.length === 0 && (
// //         <Paper
// //           sx={{
// //             position: "absolute",
// //             top: "100%",
// //             left: 0,
// //             right: 0,
// //             zIndex: 1300,
// //             p: 2,
// //             mt: 0.5,
// //           }}
// //           elevation={3}
// //         >
// //           <Typography variant="body2" color="text.secondary">
// //             No industries found matching "{searchTerm}"
// //           </Typography>
// //         </Paper>
// //       )}
// //     </Box>
// //   );
// // };

// // export default IndustryInput;

// import React, { useState, useEffect } from "react";
// import {
//   FormControl,
//   Box,
//   TextField,
//   Paper,
//   List,
//   ListItem,
//   ListItemText,
//   Typography,
// } from "@mui/material";
// import { searchIndustries } from "./locationData";

// const IndustryInput = ({
//   value = "",
//   onChange,
//   label = "Industry",
//   required = false,
// }) => {
//   const [searchTerm, setSearchTerm] = useState("");
//   const [filteredIndustries, setFilteredIndustries] = useState([]);
//   const [isOpen, setIsOpen] = useState(false);

//   useEffect(() => {
//     if (searchTerm.length > 0) {
//       const results = searchIndustries(searchTerm);
//       setFilteredIndustries(results);
//     } else {
//       setFilteredIndustries([]);
//     }
//   }, [searchTerm]);

//   const handleSearchChange = (event) => {
//     setSearchTerm(event.target.value);
//     setIsOpen(true);
//     onChange(event.target.value); // show in input
//   };

//   const handleIndustrySelect = (industry) => {
//     onChange(industry); // ✅ set selected industry
//     setSearchTerm(industry); // ✅ display selected inside input
//     setFilteredIndustries([]);
//     setIsOpen(false);
//   };

//   return (
//     <Box sx={{ position: "relative", width: "100%" }}>
//       <FormControl fullWidth required={required}>
//         <TextField
//           value={searchTerm || value}
//           onChange={handleSearchChange}
//           onFocus={() => setIsOpen(true)}
//           placeholder="Type to search industries..."
//           variant="outlined"
//           size="small"
//         />
//       </FormControl>

//       {isOpen && filteredIndustries.length > 0 && (
//         <Paper
//           sx={{
//             position: "absolute",
//             top: "100%",
//             left: 0,
//             right: 0,
//             zIndex: 1300,
//             maxHeight: 200,
//             overflow: "auto",
//             mt: 0.5,
//           }}
//           elevation={3}
//         >
//           <List dense>
//             {filteredIndustries.map((industry, index) => (
//               <ListItem
//                 key={index}
//                 button
//                 onClick={() => handleIndustrySelect(industry)}
//               >
//                 <ListItemText primary={industry} />
//               </ListItem>
//             ))}
//           </List>
//         </Paper>
//       )}

//       {isOpen && searchTerm.length > 0 && filteredIndustries.length === 0 && (
//         <Paper
//           sx={{
//             position: "absolute",
//             top: "100%",
//             left: 0,
//             right: 0,
//             zIndex: 1300,
//             p: 2,
//             mt: 0.5,
//           }}
//           elevation={3}
//         >
//           <Typography variant="body2" color="text.secondary">
//             No industries found matching "{searchTerm}"
//           </Typography>
//         </Paper>
//       )}
//     </Box>
//   );
// };

// export default IndustryInput;
import React, { useState, useEffect, useRef } from "react";
import {
  FormControl,
  Box,
  TextField,
  Paper,
  List,
  ListItem,
  ListItemText,
  Typography,
  Popper,
} from "@mui/material";
import { searchIndustries } from "./locationData";

const IndustryInput = ({
  value = "",
  onChange,
  label = "Industry",
  required = false,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredIndustries, setFilteredIndustries] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const anchorRef = useRef(null);

  useEffect(() => {
    if (searchTerm.length > 0) {
      const results = searchIndustries(searchTerm);
      setFilteredIndustries(results);
    } else {
      setFilteredIndustries([]);
    }
  }, [searchTerm]);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setIsOpen(true);
    onChange(event.target.value);
  };

  const handleIndustrySelect = (industry) => {
    onChange(industry);
    setSearchTerm(industry);
    setIsOpen(false);
  };

  return (
    <Box sx={{ position: "relative", width: "100%" }}>
      <FormControl fullWidth required={required}>
        <TextField
          ref={anchorRef}
          value={searchTerm || value}
          onChange={handleSearchChange}
          onFocus={() => setIsOpen(true)}
          placeholder="Type to search industries..."
          variant="outlined"
          size="small"
        />
      </FormControl>

      <Popper
        open={
          isOpen && (filteredIndustries.length > 0 || searchTerm.length > 0)
        }
        anchorEl={anchorRef.current}
        placement="bottom-start"
        style={{ zIndex: 9999 }}
      >
        {filteredIndustries.length > 0 ? (
          <Paper
            sx={{
              mt: 0.5,
              maxHeight: 200,
              overflow: "auto",
              width: anchorRef.current?.offsetWidth || "auto",
            }}
            elevation={3}
          >
            <List dense>
              {filteredIndustries.map((industry, index) => (
                <ListItem
                  key={index}
                  button
                  onClick={() => handleIndustrySelect(industry)}
                >
                  <ListItemText primary={industry} />
                </ListItem>
              ))}
            </List>
          </Paper>
        ) : (
          searchTerm.length > 0 && (
            <Paper
              sx={{
                mt: 0.5,
                p: 2,
                width: anchorRef.current?.offsetWidth || "auto",
              }}
              elevation={3}
            >
              <Typography variant="body2" color="text.secondary">
                No industries found matching "{searchTerm}"
              </Typography>
            </Paper>
          )
        )}
      </Popper>
    </Box>
  );
};

export default IndustryInput;
