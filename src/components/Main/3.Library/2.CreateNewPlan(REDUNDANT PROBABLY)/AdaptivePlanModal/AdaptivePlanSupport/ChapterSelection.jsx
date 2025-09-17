import React from "react";
import {
  Box,
  Typography,
  Checkbox,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  List,
} from "@mui/material";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";

export default function ChapterSelection({
  chapters = [],
  onToggleChapter,
  onToggleSubchapter, // unused now
  onAccordionToggle,
}) {
  return (
    <Box sx={{ width: "100%" }}>
      {chapters.map((chapter, cIdx) => {
        const { id, title, expanded, selected, subchapters } = chapter;

        return (
          <Box key={id} sx={{ mb: 1 }}>
            <ListItem
              disablePadding
              sx={{ backgroundColor: "#333", borderRadius: 1 }}
            >
              <ListItemButton onClick={() => onAccordionToggle(cIdx)}>
                <ListItemIcon sx={{ minWidth: "40px" }}>
                  <Checkbox
                    checked={selected}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleChapter(cIdx);
                    }}
                    // For styling: white color check, etc.
                    sx={{
                      color: "#B39DDB",
                      "&.Mui-checked": {
                        color: "#D1C4E9",
                      },
                    }}
                  />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography sx={{ color: "#fff", fontWeight: 500 }}>
                      {title}
                    </Typography>
                  }
                />
                {expanded ? (
                  <ExpandLess sx={{ color: "#fff" }} />
                ) : (
                  <ExpandMore sx={{ color: "#fff" }} />
                )}
              </ListItemButton>
            </ListItem>

            <Collapse in={expanded} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {subchapters.map((sub, sIdx) => (
                  <ListItem
                    key={sub.id}
                    sx={{ pl: 6, backgroundColor: "#444" }}
                  >
                    {/* Instead of a checkbox, we show a bullet point or icon */}
                    <ListItemIcon sx={{ minWidth: "30px" }}>
                      <Typography
                        component="span"
                        sx={{ color: "#B39DDB", fontWeight: "bold" }}
                      >
                        •
                      </Typography>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography sx={{ color: "#fff" }}>
                          {sub.title}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Collapse>
          </Box>
        );
      })}
    </Box>
  );
}