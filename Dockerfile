# Use the official Elasticsearch image as the base image
FROM docker.elastic.co/elasticsearch/elasticsearch:8.10.2

# Set environment variables for Elasticsearch
ENV discovery.type=single-node

# Expose the default Elasticsearch port
EXPOSE 9200 9300

# Run Elasticsearch
CMD ["elasticsearch"]