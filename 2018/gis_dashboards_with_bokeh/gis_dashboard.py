# Import Modules
import pandas as pd
import holoviews as hv
import geoviews as gv
#import geoviews.feature as gf
from bokeh.tile_providers import STAMEN_TONER
from bokeh.models import WMTSTileSource

hv.notebook_extension('bokeh')
import param
import parambokeh

import datashader as ds
from holoviews.operation.datashader import datashade
from datashader.colors import colormap_select, Greys9, Hot, inferno

gv.extension('bokeh')

tiles = {'OpenMap': WMTSTileSource(url='http://c.tile.openstreetmap.org/{Z}/{X}/{Y}.png'),
         'ESRI': WMTSTileSource(url='https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{Z}/{Y}/{X}.jpg'),
         'Wikipedia': WMTSTileSource(url='https://maps.wikimedia.org/osm-intl/{Z}/{X}/{Y}@2x.png'),
         'Stamen Toner': STAMEN_TONER}

nyc_taxi = pd.read_csv('data/nyc_taxi.csv', usecols= \
                       ['pickup_x', 'pickup_y', 'dropoff_x','dropoff_y', 'passenger_count','tpep_pickup_datetime'])

class NYCTaxiExplorer(hv.streams.Stream):
    alpha      = param.Magnitude(default=0.8, doc='Alpha value for the map opacity')
    plot       = param.ObjectSelector(default='pickup', objects=['pickup','dropoff'])
    passengers = param.Range(default=(0, 10), bounds=(0, 10), doc='Filter for Taxi Trips by Number of Passengers')
    output     = parambokeh.view.Plot()

    def make_view(self, x_range=None, y_range=None, **kwargs):
        options = dict(width=800, height=475, xaxis=None, yaxis=None)
        map_tiles = gv.WMTS(tiles['ESRI']).opts(style=dict(alpha=self.alpha), plot=options)

        points = hv.Points(nyc_taxi, kdims=[self.plot+'_x', self.plot+'_y'], vdims=['passenger_count'])
        selected = points.select(passenger_count=self.passengers)
        taxi_trips = datashade(selected, x_sampling=1, y_sampling=1, width=800, height=475,
                               cmap=inferno, dynamic=False)

        return map_tiles * taxi_trips

explorer = NYCTaxiExplorer(name="Taxis en NY")
explorer.output = hv.DynamicMap(explorer.make_view, streams=[explorer])
doc = parambokeh.Widgets(explorer, view_position='right', callback=explorer.event, mode='server')
