import React, { useEffect, useMemo, useState } from "react";
import {
  Box, Typography, Stack, ToggleButtonGroup, ToggleButton,
  List, ListItemButton, ListItemText, ListItemSecondaryAction,
  Chip, Badge, Divider, Button, Tooltip, Switch, FormControlLabel
} from "@mui/material";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

const LS_KEY = "tellus.notifications.v1";

/** Seed demo notifications if none exist */
function seed() {
  const now = Date.now();
  return [
    {
      id: `n-${now-60000}`, ts: new Date(now-60000).toISOString(),
      type: "assignment", projectId: 1, projectName: "SFT Project A",
      title: "You were assigned to SFT Project A",
      detail: "Daily quota set to 50 items.",
      unread: true
    },
    {
      id: `n-${now-45000}`, ts: new Date(now-45000).toISOString(),
      type: "pause", projectId: 2, projectName: "RM Project B",
      title: "Project paused", detail: "RM Project B was paused by Bob.",
      unread: true
    },
    {
      id: `n-${now-30000}`, ts: new Date(now-30000).toISOString(),
      type: "flag", projectId: 1, projectName: "SFT Project A",
      itemId: "resp-1029",
      title: "Item flagged in SFT Project A",
      detail: "Annotator flagged a confusing prompt.",
      unread: true
    },
    {
      id: `n-${now-15000}`, ts: new Date(now-15000).toISOString(),
      type: "export", projectId: 3, projectName: "Safety Eval C",
      title: "Export ready", detail: "Your Safety Eval C export is ready.",
      unread: true
    },
  ];
}

const LABELS = {
  all: "All",
  assignment: "Assignments",
  pause: "Pauses",
  flag: "Flags",
  export: "Exports",
};

export default function Notifications({ onOpenProject }) {
  const [items, setItems] = useState(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
      if (Array.isArray(raw) && raw.length) return raw;
    } catch {}
    const seeded = seed();
    localStorage.setItem(LS_KEY, JSON.stringify(seeded));
    return seeded;
  });

  const [filter, setFilter] = useState("all");
  const [groupSimilar, setGroupSimilar] = useState(true);

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(items));
  }, [items]);

  const unreadCount = useMemo(() => items.filter(i => i.unread).length, [items]);

  const filtered = useMemo(() => {
    if (filter === "all") return items.slice().sort((a,b)=>+new Date(b.ts)-+new Date(a.ts));
    return items.filter(i => i.type === filter).sort((a,b)=>+new Date(b.ts)-+new Date(a.ts));
  }, [items, filter]);

  const grouped = useMemo(() => {
    if (!groupSimilar) return [];
    const map = new Map();
    for (const n of filtered) {
      const key = `${n.type}|${n.projectId||"none"}`;
      if (!map.has(key)) map.set(key, { key, type: n.type, projectId: n.projectId, projectName: n.projectName, latestTs: n.ts, count: 0, unread: 0, items: [] });
      const g = map.get(key);
      g.items.push(n);
      g.count++;
      g.unread += n.unread ? 1 : 0;
      if (new Date(n.ts) > new Date(g.latestTs)) g.latestTs = n.ts;
    }
    return Array.from(map.values()).sort((a,b)=>+new Date(b.latestTs)-+new Date(a.latestTs));
  }, [filtered, groupSimilar]);

  const markRead = (ids) => {
    setItems(prev => prev.map(i => ids.includes(i.id) ? { ...i, unread: false } : i));
  };

  const markAllRead = () => {
    setItems(prev => prev.map(i => ({ ...i, unread: false })));
  };

  const handleOpen = (notif) => {
    // Mark read automatically on open
    markRead([notif.id]);
    // Navigate to the source (project/item)
    if (onOpenProject && notif.projectId) {
      onOpenProject(notif.projectId);
    } else {
      window.alert("Open source: " + (notif.projectName || notif.title));
    }
  };

  const handleOpenGroup = (g) => {
    // Mark the whole group as read
    markRead(g.items.map(i => i.id));
    if (onOpenProject && g.projectId) {
      onOpenProject(g.projectId);
    } else {
      window.alert(`Open project: ${g.projectName || "(no project)"}`);
    }
  };

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <NotificationsNoneIcon /> Notifications
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        <FormControlLabel
          control={<Switch checked={groupSimilar} onChange={(_,v)=>setGroupSimilar(v)} />}
          label="Group similar"
        />
        <Tooltip title="Mark all as read">
          <span>
            <Button onClick={markAllRead} disabled={unreadCount===0}>Mark all read</Button>
          </span>
        </Tooltip>
      </Stack>

      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={filter}
          onChange={(_,v)=>v && setFilter(v)}
        >
          {Object.entries(LABELS).map(([key,label])=>(
            <ToggleButton key={key} value={key}>
              {key==="all" ? (
                <Badge badgeContent={unreadCount} color="primary">{label}</Badge>
              ) : (
                label
              )}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Stack>

      <Divider sx={{ mb: 1 }} />

      {/* Grouped view */}
      {groupSimilar ? (
        grouped.length === 0 ? (
          <Empty />
        ) : (
          <List>
            {grouped.map(g => (
              <ListItemButton key={g.key} onClick={()=>handleOpenGroup(g)}>
                <ListItemText
                  primary={
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography sx={{ fontWeight: 600, mr: .5 }}>
                        {LABELS[g.type] || g.type}
                      </Typography>
                      {g.projectName && <Chip size="small" label={g.projectName} />}
                      <Chip
                        size="small"
                        label={`${g.count} ${g.count>1 ? "alerts" : "alert"}`}
                        variant="outlined"
                      />
                      {g.unread>0 && <Chip size="small" color="primary" label={`${g.unread} new`} />}
                    </Stack>
                  }
                  secondary={new Date(g.latestTs).toLocaleString()}
                />
                <ListItemSecondaryAction>
                  <ArrowForwardIcon />
                </ListItemSecondaryAction>
              </ListItemButton>
            ))}
          </List>
        )
      ) : (
        /* Flat list */
        (filtered.length === 0 ? <Empty /> : (
          <List>
            {filtered.map(n => (
              <ListItemButton key={n.id} onClick={()=>handleOpen(n)}>
                <ListItemText
                  primary={
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ flexWrap: "wrap" }}>
                      <Typography sx={{ fontWeight: n.unread ? 700 : 500 }}>{n.title}</Typography>
                      {n.projectName && <Chip size="small" label={n.projectName} />}
                      {n.unread && <Chip size="small" color="primary" label="new" />}
                    </Stack>
                  }
                  secondary={n.detail || new Date(n.ts).toLocaleString()}
                />
                <ListItemSecondaryAction>
                  <ArrowForwardIcon />
                </ListItemSecondaryAction>
              </ListItemButton>
            ))}
          </List>
        ))
      )}
    </Box>
  );
}

function Empty() {
  return (
    <Box sx={{ p: 3, textAlign: "center", color: "text.secondary" }}>
      <Typography variant="body2">No notifications yet.</Typography>
      <Typography variant="caption">You’ll see project activity and system alerts here.</Typography>
    </Box>
  );
}