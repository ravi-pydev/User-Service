
# Create your views here.
# import redis
from django.conf import settings
from django.http import HttpResponse

from rest_framework.views import APIView

# from utils.helpers.decorators import log_api_response


class Home(APIView):
	""" 
	CUS Home API
	Permissions:
		- ApiKeyPermission: Ensures requests include a valid API key.
	"""

	# @log_api_response
	def get(self, request):
		return HttpResponse("API Backend for Common User Service")

