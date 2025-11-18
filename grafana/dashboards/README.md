# Grafana Dashboards

Place JSON dashboard definitions in this directory to have them automatically provisioned into the Grafana container that ships with `docker-compose.dev.yml`.

Each dashboard file should follow Grafana's standard export format and include a unique `uid`. When Grafana starts, it scans `/etc/grafana/provisioning/dashboards` (bound to this folder) and loads any dashboards it finds.
